from pathlib import Path
from promnesia.common import traverse
from unittest.mock import Mock, patch
from common import DATA


testDataPath = Path(DATA) / 'traverse'

# Patch shutil.which so it always returns false (when trying to which fdfind, etc)
# so that it falls back to find
@patch('promnesia.common.shutil.which', return_value=False)
def test_traverse_ignore_find(patched):
    '''
    traverse() with `find` but ignore some stuff
    '''
    # act
    paths = list(traverse(testDataPath, ignore=['ignoreme.txt', 'ignoreme2']))

    # assert
    assert paths == [testDataPath / 'imhere2/real.txt', testDataPath / 'imhere.txt']

def test_traverse_ignore_fdfind():
    '''
    traverse() with `fdfind` but ignore some stuff
    '''
    # act
    paths = list(traverse(testDataPath, ignore=['ignoreme.txt', 'ignoreme2']))

    # assert
    assert paths == [testDataPath / 'imhere.txt', testDataPath / 'imhere2/real.txt']
