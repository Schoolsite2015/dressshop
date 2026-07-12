import { useState, useCallback } from "react";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { Capacitor } from "@capacitor/core";

export function useCameraPermission() {
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      console.warn("Camera permissions only apply to native mobile devices.");
      return true;
    }

    try {
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera === "granted") {
        setHasPermission(true);
        return true;
      }
      
      if (camera === "denied") {
        alert("Camera permission was denied. Please enable it in your device settings.");
        return false;
      }

      // Prompt JIT (Just in Time)
      const request = await BarcodeScanner.requestPermissions();
      const granted = request.camera === "granted";
      setHasPermission(granted);
      return granted;
    } catch (e) {
      console.error("Failed to request camera permission", e);
      return false;
    }
  }, []);

  return { hasPermission, requestPermission };
}
