"use client";

import { useEffect, useState, useCallback } from "react";

interface AnimationSettings {
  reduceMotion: boolean;
  enableHeavyAnimations: boolean;
  performanceMode: "low" | "medium" | "high";
}

export function useOptimizedAnimations() {
  const [settings, setSettings] = useState<AnimationSettings>({
    reduceMotion: false,
    enableHeavyAnimations: true,
    performanceMode: "high",
  });

  useEffect(() => {
    // Check user preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Check device capabilities
    const isLowEndDevice = () => {
      // Check for hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency || 4;

      // Check for device memory (if available)
      const memory = (navigator as any).deviceMemory || 4;

      // Check for connection speed
      const connection = (navigator as any).connection;
      const isSlowConnection =
        connection &&
        (connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g");

      return cores < 4 || memory < 4 || isSlowConnection;
    };

    // Determine performance mode
    let performanceMode: "low" | "medium" | "high" = "high";

    if (prefersReducedMotion || isLowEndDevice()) {
      performanceMode = "low";
    } else if (isLowEndDevice()) {
      performanceMode = "medium";
    }

    setSettings({
      reduceMotion: prefersReducedMotion,
      enableHeavyAnimations: performanceMode === "high",
      performanceMode,
    });
  }, []);

  const getAnimationConfig = useCallback(
    (type: "basic" | "advanced" | "heavy") => {
      if (settings.reduceMotion) {
        return {
          duration: 0,
          enabled: false,
          reduce: true,
        };
      }

      switch (settings.performanceMode) {
        case "low":
          return {
            duration: type === "heavy" ? 0 : 0.3,
            enabled: type !== "heavy",
            reduce: true,
          };
        case "medium":
          return {
            duration: type === "heavy" ? 0.5 : 0.6,
            enabled: true,
            reduce: type === "heavy",
          };
        case "high":
        default:
          return {
            duration: type === "heavy" ? 1.2 : 0.8,
            enabled: true,
            reduce: false,
          };
      }
    },
    [settings],
  );

  const shouldUseThreeJS = useCallback(() => {
    return (
      settings.performanceMode === "high" && settings.enableHeavyAnimations
    );
  }, [settings]);

  const shouldUseGSAP = useCallback(() => {
    return settings.performanceMode !== "low";
  }, [settings]);

  const getParticleDensity = useCallback(() => {
    switch (settings.performanceMode) {
      case "low":
        return "low";
      case "medium":
        return "medium";
      case "high":
        return "high";
      default:
        return "medium";
    }
  }, [settings]);

  return {
    settings,
    getAnimationConfig,
    shouldUseThreeJS,
    shouldUseGSAP,
    getParticleDensity,
  };
}
