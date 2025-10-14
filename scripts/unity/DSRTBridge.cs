using System;
using System.Runtime.InteropServices;
using UnityEngine;

public class DSRTBridge : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")] private static extern IntPtr DSRT_InitSession();
    [DllImport("__Internal")] private static extern void DSRT_RequestBotDetection();
    [DllImport("__Internal")] private static extern IntPtr DSRT_GetLastBotResult();
    [DllImport("__Internal")] private static extern void DSRT_SetAnalyticsEndpoint(string url);
    [DllImport("__Internal")] private static extern void DSRT_SendEvent(string json);
#else
    private static IntPtr DSRT_InitSession() { return IntPtr.Zero; }
    private static void DSRT_RequestBotDetection() {}
    private static IntPtr DSRT_GetLastBotResult() { return IntPtr.Zero; }
    private static void DSRT_SetAnalyticsEndpoint(string url) {}
    private static void DSRT_SendEvent(string json) {}
#endif

    void Start()
    {
        try {
            var ptr = DSRT_InitSession();
            if(ptr != IntPtr.Zero) {
                var json = Marshal.PtrToStringAnsi(ptr);
                Debug.Log("[DSRT] Session init: " + json);
            }
        } catch(Exception ex) { Debug.LogWarning("[DSRT] Init error: " + ex.Message); }

        DSRT_SetAnalyticsEndpoint(Application.absoluteURL + "collect");
        DSRT_RequestBotDetection();
    }

    public void OnBotDetection(string jsonFlags) {
        Debug.Log("[DSRT] Bot flags: " + jsonFlags);
    }

    public void SendEvent(object evt) {
        var json = JsonUtility.ToJson(evt);
        DSRT_SendEvent(json);
    }
}
