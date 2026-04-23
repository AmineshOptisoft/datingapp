import axios from 'axios';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

/**
 * Sends a push notification using OneSignal REST API.
 * @param externalUserId The user's ID in your database (mapped to OneSignal's external_id)
 * @param title Title of the notification
 * @param message Body of the notification
 * @param data Optional Deep linking or extra data
 * @param options Optional extra OneSignal fields (buttons, android_sound, etc.)
 */
export async function sendNotificationToUser(
  externalUserId: string,
  title: string,
  message: string,
  data?: any,
  options?: {
    buttons?: { id: string; text: string }[];
    android_sound?: string;
    android_channel_id?: string;
    [key: string]: any;
  }
) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn("⚠️ OneSignal logic skipped: Missing APP_ID or REST_API_KEY in .env");
    return false;
  }

  try {
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: {
        external_id: [externalUserId]
      },
      target_channel: "push",
      headings: { en: title },
      contents: { en: message },
      data: data || {},
      // Merge any extra options (buttons, sound, channel etc.)
      ...options,
    };

    // Debug: log the exact payload being sent to OneSignal
    console.log(`📦 [OneSignal] Payload for ${externalUserId}:`, JSON.stringify(payload, null, 2));

    const response = await axios.post(
      "https://api.onesignal.com/notifications",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
          accept: "application/json",
        },
      }
    );

    console.log(`✅ OneSignal Push sent to user ${externalUserId}:`, response.data);
    return true;
  } catch (error: any) {
    console.error(
      "❌ OneSignal Push Error:",
      error?.response?.data || error.message
    );
    return false;
  }
}
