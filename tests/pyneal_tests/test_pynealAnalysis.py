import os
from os.path import join
import sys

import numpy as np
import nibabel as nib

import helper_tools

# get dictionary with relevant paths for tests within this module
paths = helper_tools.get_pyneal_scanner_test_paths()
sys.path.insert(0, paths['pynealDir'])

from src.pynealAnalysis import Analyzer

maskFile = join(paths['testDataDir'], 'testSeries_mask.nii.gz')
seriesFile = join(paths['testDataDir'], 'testSeries.nii.gz')

class Test_pynealAnalysis:
    """ Test pyneal.src.pynealAnalysis module """

    def test_average(self):
        """ test Analyzer computing average signal within mask """
        # settings dictionary for this test
        settings = {'maskFile': maskFile,
                    'analysisChoice': 'Average',
                    'maskIsWeighted': False}

        # create instance of Analyzer class
        analyzer = Analyzer(settings)

        # loop over series and test
        seriesData = nib.load(seriesFile)
        results = []
        for volIdx in range(seriesData.shape[3]):
            # extract the 3d array for this vol and convert to niftiobject
            thisVol = seriesData.get_data()[:, :, :, volIdx]
            result = analyzer.runAnalysis(thisVol, volIdx)

            results.append(result['average'])

        # make np arrays of results and what results are expected to be
        results = np.array(results)
        expectedResults = np.array([1029.15, 1032.78, 1034.14])

        # use np testing method to assert with customized precision
        np.testing.assert_almost_equal(results, expectedResults, decimal=2)

    def test_weightedAverage(self):
        """ test Analyzer computing weighted average signal within mask """
        # settings dictionary for this test
        settings = {'maskFile': maskFile,
                    'analysisChoice': 'Average',
                    'maskIsWeighted': True}

        # create instance of Analyzer class
        analyzer = Analyzer(settings)

        # loop over series and test
        seriesData = nib.load(seriesFile)
        results = []
        for volIdx in range(seriesData.shape[3]):
            # extract the 3d array for this vol and convert to niftiobject
            thisVol = seriesData.get_data()[:, :, :, volIdx]
            result = analyzer.runAnalysis(thisVol, volIdx)

            results.append(result['weightedAverage'])

        print(results)

        # make np arrays of results and what results are expected to be
        results = np.array(results)
        expectedResults = np.array([1015.42, 1018.94, 1020.68])

        # use np testing method to assert with customized precision
        np.testing.assert_almost_equal(results, expectedResults, decimal=2)
