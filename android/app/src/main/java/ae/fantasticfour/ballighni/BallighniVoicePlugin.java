package ae.fantasticfour.ballighni;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;
import java.util.Locale;

/** User-started, single-utterance speech. No background listening or report submission. */
@CapacitorPlugin(name = "BallighniVoice", permissions = {
    @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
})
public class BallighniVoicePlugin extends Plugin {
    private SpeechRecognizer recognizer;
    private PluginCall pending;
    private TextToSpeech speech;
    private boolean speechReady;

    @PluginMethod
    public void availability(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", SpeechRecognizer.isRecognitionAvailable(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void listen(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "microphoneResult");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void microphoneResult(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) begin(call);
        else call.reject("Microphone permission was not granted. You can still type your statement.");
    }

    private void begin(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (pending != null) { call.reject("Already listening. Stop the current session first."); return; }
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                call.reject("No Android speech recognition service is available. Use typing or your keyboard's voice input."); return;
            }
            pending = call;
            recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
            recognizer.setRecognitionListener(new RecognitionListener() {
                public void onReadyForSpeech(Bundle params) {}
                public void onBeginningOfSpeech() {}
                public void onRmsChanged(float rmsdB) {}
                public void onBufferReceived(byte[] buffer) {}
                public void onEndOfSpeech() {}
                public void onPartialResults(Bundle results) {}
                public void onEvent(int eventType, Bundle params) {}
                public void onError(int error) {
                    PluginCall target = pending; pending = null;
                    releaseRecognizer();
                    if (target != null) target.reject(error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT
                        ? "No clear speech was recognized. Try again or type your statement."
                        : "The Android speech service could not finish. Check permission, network and language support, or type instead.");
                }
                public void onResults(Bundle results) {
                    ArrayList<String> values = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    PluginCall target = pending; pending = null;
                    releaseRecognizer();
                    if (target == null) return;
                    if (values == null || values.isEmpty()) { target.reject("No clear speech was recognized."); return; }
                    JSObject result = new JSObject(); result.put("text", values.get(0)); target.resolve(result);
                }
            });
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, call.getString("language", "en-AE"));
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            try { recognizer.startListening(intent); }
            catch (Exception error) { pending = null; releaseRecognizer(); call.reject("Speech recognition could not start. You can type instead."); }
        });
    }

    private void releaseRecognizer() {
        if (recognizer != null) { recognizer.destroy(); recognizer = null; }
    }

    @PluginMethod
    public void speak(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (speech == null) {
                speech = new TextToSpeech(getContext(), status -> {
                    speechReady = status == TextToSpeech.SUCCESS;
                    if (speechReady) speakReady(call);
                    else call.reject("Android text-to-speech is not available. Check your device speech settings.");
                });
            } else if (speechReady) speakReady(call);
            else call.reject("The speech engine is starting. Try again shortly.");
        });
    }

    private void speakReady(PluginCall call) {
        String text = call.getString("text", "");
        if (text.isEmpty() || text.length() > 6000) { call.reject("Choose up to 6000 characters to read."); return; }
        Locale language = Locale.forLanguageTag(call.getString("language", "en-AE"));
        int support = speech.setLanguage(language);
        if (support == TextToSpeech.LANG_MISSING_DATA || support == TextToSpeech.LANG_NOT_SUPPORTED) {
            call.reject("This speech language is not installed on the device."); return;
        }
        speech.setSpeechRate(0.85f);
        int result = speech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ballighni-reading");
        if (result == TextToSpeech.ERROR) call.reject("The device could not read this text.");
        else call.resolve();
    }

    private void cancel() {
        if (recognizer != null) recognizer.cancel();
        PluginCall target = pending; pending = null;
        releaseRecognizer();
        if (target != null) target.reject("Listening stopped.");
        if (speech != null) speech.stop();
    }

    @PluginMethod
    public void stop(PluginCall call) { getActivity().runOnUiThread(() -> { cancel(); call.resolve(); }); }
    @Override
    protected void handleOnPause() { super.handleOnPause(); getActivity().runOnUiThread(this::cancel); }
    @Override
    protected void handleOnDestroy() {
        cancel();
        if (speech != null) { speech.shutdown(); speech = null; speechReady = false; }
        super.handleOnDestroy();
    }
}
