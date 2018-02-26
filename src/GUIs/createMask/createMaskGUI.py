"""
Create Mask GUI:
GUI to set inputs and option for creating a mask to use during Pyneal real-time
analysis. Pyneal requires that all masks be in subject functional space; this
tool helps create those.

All of the settings are stored in a createMaskConfig.yaml file. This GUI reads
that file to obtain initial settings, and then once the user hits 'submit' the
file is overwritten with new settings
"""
import os
from os.path import join
import sys

import yaml

from kivy.app import App
from kivy.uix.widget import Widget
from kivy.uix.label import Label
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.textinput import TextInput
from kivy.properties import StringProperty, NumericProperty, ListProperty, ObjectProperty, DictProperty, BooleanProperty
from kivy.uix.filechooser import FileChooserListView
from kivy.uix.popup import Popup
from kivy.factory import Factory



# Set Window Size
from kivy.config import Config
Config.set('graphics', 'width', '400')
Config.set('graphics', 'height', '500')

# initialize global var that will store path to createMaskConfig.yaml file
createMaskConfigFile = None

class FilePathInputField(TextInput):
    pass


class InputPathWidget(BoxLayout):
    """
    class for allowing user to modify a file path. Contains a
    text input field showing the current path, which can be modified by hand.
    Alternatively, the user can click the folder icon to open up a file browser
    to select a new file/dir using that method
    """
    setupGUI_dir = os.path.dirname(os.path.abspath(__file__))
    textColor = ListProperty([0,0,0,1])
    disabledTextColor = ListProperty([.6, .6, .6, 1])
    labelText = StringProperty('test')
    currentPath = StringProperty()
    isDisabled = BooleanProperty(False)

    def updateCurrentPath(self, path, selection):
        # if a file was selected, return full path to the file
        if len(selection) > 0:
            self.currentPath = join(path, selection[0])
        # if it was a dir instead, just return the path to the dir
        else:
            self.currentPath = path

        # close the parent popup
        self._popup.dismiss()


    def launchFileBrowser(self, path='~/', fileFilter=[]):
        """
        generic function to present a popup window with a file browser. Customize this with the parameters you pass in
            - path: path where the file browswer will start
            - fileFilter: list of file types to filter; e.g. ['*.txt']
            - loadFunc: function that will be called when 'load' button pressed
        """
        # check to make sure the current path points to a real location
        if os.path.exists(self.currentPath):
            startingPath = self.currentPath
        else:
            startingPath = '~/'
        print(startingPath)
        # method to pop open a file browser
        content = LoadFileDialog(loadFunc=self.updateCurrentPath,
                                    cancelFileChooser=self.cancelFileChooser,
                                    path=startingPath,
                                    fileFilter=fileFilter)
        self._popup = Popup(title="Select", content=content,
                            size_hint=(0.9,0.9))
        self._popup.open()


    def cancelFileChooser(self):
        # close the file chooser dialog
        self._popup.dismiss()


class LoadFileDialog(BoxLayout):
    """ generic class to present file chooser popup """
    loadFunc= ObjectProperty(None)
    cancelFileChooser = ObjectProperty(None)
    path = StringProperty()
    fileFilter = ListProperty()


class ErrorNotification(BoxLayout):
    """ class to load error notification popup """
    errorMsg = StringProperty('')


class MainContainer(BoxLayout):
    """
    Root level widget for the createMask GUI
    """
    # create a kivy DictProperty that will store a dictionary with all of the
    # settings for the GUI.
    GUI_settings = DictProperty({}, rebind=True)
    setupGUI_dir = os.path.dirname(os.path.abspath(__file__))
    print(setupGUI_dir)
    textColor = ListProperty([0,0,0,1])


    ### Show Notification Pop-up ##############################################
    def show_ErrorNotification(self, msg):
        self._notification = Popup(
                        title='Errors',
                        content=ErrorNotification(errorMsg=msg),
                        size_hint=(.5, .5)).open()


class CreateMaskGUIApp(App):
    """
    Root App class. This will look for the createMaskGUI.kv file in the same
    directory and build the GUI according to the parameters outlined in that file.
    Calling 'run' on this class instance will launch the GUI
    """
    title = 'Create Mask'
    pass


# Register the various components of the GUI
Factory.register('MainContainer', cls=MainContainer)
Factory.register('LoadFileDialog', cls=LoadFileDialog)
Factory.register('ErrorNotification', cls=ErrorNotification)
Factory.register('InputPathWidget', cls=InputPathWidget)


def launchCreateMaskGUI(settingsFile):
    """
    launch the createMask GUI. Call this function to open the GUI. The GUI will
    be populated with the settings specified in the 'settingsFile'.

    settingsFile: path to yaml file containing createMaskConfig settings
    """
    global createMaskConfigFile
    createMaskConfigFile = settingsFile

    # launch the app
    CreateMaskGUIApp().run()



# for testing purposes, you can launch the GUI directly from the command line
if __name__ == '__main__':
    # path to config file
    settingsFile = 'createMaskConfig.yaml'

    # launch GUI
    launchCreateMaskGUI(settingsFile)
