import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export const initializePushNotifications = async () => {
  try {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }

    // Register with Apple / Google
    await PushNotifications.register();

    // Listen for registration
    await PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      
      // Store token in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user.id,
            enabled: true,
          });
      }
    });

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error: ', error);
    });

    // Listen for push notifications
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('Push received: ', notification);
      }
    );

    // Listen for notification actions
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log('Push action performed: ', notification);
      }
    );
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

export const requestNotificationPermission = async () => {
  try {
    const permStatus = await PushNotifications.requestPermissions();
    return permStatus.receive === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};
