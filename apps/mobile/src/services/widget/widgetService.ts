// src/services/widget/widgetService.ts
import { NativeModules, Platform } from 'react-native';

const { TripSplitWidgetModule } = NativeModules;

class WidgetService {
  async updateAllWidgets(): Promise<boolean> {
    if (Platform.OS !== 'android' || !TripSplitWidgetModule?.updateWidget) {
      return false;
    }
    try {
      // Safely call module if present
      await TripSplitWidgetModule.updateWidget();
      return true;
    } catch {
      return false;
    }
  }
}

export const widgetService = new WidgetService();
