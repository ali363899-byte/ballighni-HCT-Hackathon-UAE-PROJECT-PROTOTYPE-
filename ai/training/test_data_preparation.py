"""Training-data regression checks: split leakage and scratch class remapping."""
import tempfile, unittest
from pathlib import Path
from unittest.mock import patch
import scratch_training as training

class PreparationTests(unittest.TestCase):
    def test_source_variants_group_together(self):
        self.assertEqual(training.group_key('vehide_z123_'+'a'*32+'.jpg'),training.group_key('vehide_z123_'+'b'*32+'.jpg'))
        self.assertNotEqual(training.group_key('vehide_01022020_104459image894113.jpg'),training.group_key('vehide_01022020_104510image892040.jpg'))

    def test_exact_duplicates_do_not_cross_splits_and_scratch_class_is_remapped(self):
        names=['images/train/vehide_trainA.jpg','images/train/vehide_trainB.jpg','images/val/vehide_valA.jpg','images/val/vehide_valB.jpg']
        class Metadata:
            def raise_for_status(self):pass
            def json(self):return {'siblings':[{'rfilename':'images/train/vehide_orphan.jpg'}]+[{'rfilename':n} for n in names+[n.replace('images/','labels/').replace('.jpg','.txt') for n in names]]}
        def fake_fetch(url,path):
            path.parent.mkdir(parents=True,exist_ok=True)
            if path.suffix=='.txt':path.write_text('4 0.5 0.5 0.2 0.1\n')
            elif path.suffix=='.jpg':path.write_bytes(b'duplicate' if 'trainA' in path.name or 'valA' in path.name else path.name.encode())
            else:path.write_text('synthetic')
            return path
        with tempfile.TemporaryDirectory() as folder,patch.object(training.requests,'get',return_value=Metadata()),patch.object(training,'fetch_file',side_effect=fake_fetch):
            root=Path(folder);training.prepare(root,2,1,1)
            import json
            manifest=json.loads((root/'manifest.json').read_text())['files']
            self.assertEqual(len(manifest),3)
            self.assertEqual(len({m['sha256'] for m in manifest}),3)
            for label in (root/'dataset/labels').rglob('*.txt'):self.assertTrue(label.read_text().startswith('1 '))

if __name__=='__main__':unittest.main()
