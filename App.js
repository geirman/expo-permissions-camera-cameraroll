import React, { Component } from 'react';
import { Alert, Button, Linking, StyleSheet, View } from 'react-native';
import { Constants, ImageManipulator, ImagePicker, IntentLauncherAndroid, MailComposer, Permissions } from 'expo';

const layout = {
  isIOS: true,
}

export default class App extends Component {

  permissionsAlert = () =>
  Alert.alert(
    'Permissions Required',
    'FrogQuest app requires Camera & Camera Roll access to function properly. Please go to settings to enable manually (or restart the app).',
    [
      { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
      {
        text: 'Settings',
        onPress: () =>
          layout.isIOS
            ? Linking.openURL('app-settings:')
            : IntentLauncherAndroid.startActivityAsync(
                IntentLauncherAndroid.ACTION_MANAGE_APPLICATIONS_SETTINGS
              ),
      },
    ]
  );

  hasPermissions = async () => {
    const { CAMERA, CAMERA_ROLL } = Permissions;
    const permissions = {
      [CAMERA]: await Permissions.askAsync(CAMERA),
      [CAMERA_ROLL]: await Permissions.askAsync(CAMERA_ROLL),
    };
    console.log({ permissions });

    if (permissions[CAMERA].status !== 'granted' || permissions[CAMERA_ROLL].status !== 'granted') {
      return Promise.reject(new Error('Camera & Camera Roll Permissions Required'));
    }
    return Promise.resolve(true);
  };

  pickFromGallery = async () => {

    this.hasPermissions()
      .then(async () => await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'Images' }))
      .then(this.maybeEmailImage)
      .catch(error => {
        console.log(`[ pickFromGallery ] ${error}`);
        this.permissionsAlert();
      });
  };

  pickFromCamera = async () => {

    this.hasPermissions()
      .then(async () => await ImagePicker.launchCameraAsync())
      .then(this.maybeEmailImage)
      .catch(error => {
        console.log(`[ pickFromCamera ] ${error}`);
        this.permissionsAlert();
      });
  };

  maybeEmailImage = async image => {

    if (!image.cancelled) {
      // Resize & Email the Image
      const isPortrait = image.height > image.width;
      const actions = isPortrait ? [{ resize: { height: 1024 } }] : [{ resize: { width: 1024 } }];
      const saveOptions = { compress: 1 };
      const resizedImage = await ImageManipulator.manipulate(image.uri, actions, saveOptions);

      MailComposer.composeAsync({
        recipients: ['chris@geirman.com'],
        subject: 'Test',
        body: 'Your comment (optional):',
        isHtml: false,
        attachments: [resizedImage.uri],
      });
    } else {
      console.log('image.cancelled ==', image.cancelled);
    }
  };



  render() {
    return (
      <View style={styles.container}>

        <Button
          title="Pick from Camera"
          onPress={this.pickFromCamera}
        />
        <Button
          title="Pick from Gallery"
          onPress={this.pickFromGallery}
        />

      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
});
