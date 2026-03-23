import { createClient } from '../supabase/client';

export const NotificationService = {
  async isSupported() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  async requestPermission() {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribe() {
    if (!(await this.isSupported())) return null;

    const registration = await navigator.serviceWorker.ready;
    
    // We expect the VAPID key to be in environment variables
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID Public Key not found in environment variables.');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Store the subscription in Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscription,
          endpoint: subscription.endpoint,
          updated_at: new Date().toISOString()
        }, { onConflict: 'endpoint' });
      
      if (error) {
        console.error('Failed to save subscription:', error);
        return null;
      }
    }

    return subscription;
  },

  async unsubscribe() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .match({ user_id: user.id, subscription: JSON.stringify(subscription) });
      }
    }
  }
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
