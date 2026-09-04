import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export const dataExport = {
  /**
   * Export all user data as JSON
   */
  async exportAllData(
    userData: any,
    trips: any[],
    expenses: any[],
    settlements: any[],
  ) {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        app: 'Wakeru',
        user: {
          displayName: userData?.displayName,
          email: userData?.email,
          preferences: userData?.preferences,
          stats: userData?.stats,
        },
        trips: trips.map((t: any) => ({
          title: t.title,
          description: t.description,
          startDate: t.startDate,
          endDate: t.endDate,
          baseCurrency: t.baseCurrency,
          totalSpent: t.totalSpentBase,
          stops: t.stops?.map((s: any) => ({
            name: s.name,
            currency: s.currency,
            totalSpent: s.totalSpentLocal,
            expenseCount: s.expenseCount,
          })),
          memberCount: t.members?.filter((m: any) => m.isActive).length,
        })),
        expenses: expenses.map((e: any) => ({
          title: e.title,
          category: e.category,
          amount: e.amountBase,
          currency: e.baseCurrency,
          date: e.date,
          paidBy: e.paidByName,
          splitMethod: e.splitMethod,
          isSettled: e.isSettled,
        })),
        settlements: settlements?.map((s: any) => ({
          transactions: s.transactions?.map((t: any) => ({
            from: t.fromName,
            to: t.toName,
            amount: t.amountBase,
            status: t.status,
          })),
        })),
        summary: {
          totalTrips: trips.length,
          totalExpenses: expenses.length,
          totalSpent: expenses.reduce(
            (s: number, e: any) => s + (e.amountBase || 0),
            0,
          ),
          totalSettled: expenses.filter((e: any) => e.isSettled).length,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `wakeru-export-${new Date().toISOString().split('T')[0]}.json`;
      const file = new File(Paths.cache, fileName);

      file.write(jsonString, {
        encoding: 'utf8',
      });
      const fileUri = file.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Wakeru Data',
          UTI: 'public.json',
        });
        return true;
      } else {
        Alert.alert('Sharing not available', 'File saved to app cache.');
        return false;
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Could not export data');
      return false;
    }
  },

  /**
   * Export expenses as CSV
   */
  async exportExpensesCSV(expenses: any[]) {
    try {
      const headers = [
        'Date',
        'Title',
        'Category',
        'Amount',
        'Currency',
        'Paid By',
        'Split Method',
        'Trip',
        'Settled',
      ];
      const rows = expenses.map((e: any) => [
        new Date(e.date).toISOString().split('T')[0],
        `"${e.title}"`,
        e.category,
        e.amountBase?.toString() || '0',
        e.baseCurrency || 'INR',
        `"${e.paidByName || ''}"`,
        e.splitMethod || '',
        `"${e.tripTitle || ''}"`,
        e.isSettled ? 'Yes' : 'No',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((r: string[]) => r.join(',')),
      ].join('\n');
      const fileName = `wakeru-expenses-${new Date().toISOString().split('T')[0]}.csv`;
      const file = new File(Paths.cache, fileName);

      file.write(csv, {
        encoding: 'utf8',
      });
      const fileUri = file.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Expenses CSV',
          UTI: 'public.comma-separated-values-text',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Could not export CSV');
      return false;
    }
  },
};

// import * as FileSystem from 'expo-file-system/legacy';
// import * as Sharing from 'expo-sharing';
// import { storage } from '../../utils/storage';

// export const dataExport = {
//     async exportAsJSON(data: any, filename: string = 'tripsplit-backup'): Promise<void> {
//         const json = JSON.stringify(data, null, 2);
//         const fileUri = (FileSystem.cacheDirectory ?? '') + `${filename}-${Date.now()}.json`;

//         await FileSystem.writeAsStringAsync(fileUri, json, {
//             encoding: FileSystem.EncodingType.UTF8,
//         });

//         if (await Sharing.isAvailableAsync()) {
//             await Sharing.shareAsync(fileUri, {
//                 mimeType: 'application/json',
//                 dialogTitle: 'Export TripSplit Data',
//             });
//         }
//     },

//     async exportAsCSV(expenses: any[], filename: string = 'tripsplit-expenses'): Promise<void> {
//         const headers = ['Date', 'Title', 'Category', 'Amount', 'Currency', 'Paid By', 'Split Method', 'Trip', 'Stop', 'Settled'];
//         const rows = expenses.map((e: any) => [
//             new Date(e.date).toISOString().split('T')[0],
//             `"${e.title}"`,
//             e.category,
//             e.amountBase.toString(),
//             e.baseCurrency,
//             `"${e.paidByName}"`,
//             e.splitMethod,
//             `"${e.tripTitle || ''}"`,
//             `"${e.stopName || ''}"`,
//             e.isSettled ? 'Yes' : 'No',
//         ]);

//         const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
//         const fileUri = (FileSystem.cacheDirectory ?? '') + `${filename}-${Date.now()}.csv`;

//         await FileSystem.writeAsStringAsync(fileUri, csv, {
//             encoding: FileSystem.EncodingType.UTF8,
//         });

//         if (await Sharing.isAvailableAsync()) {
//             await Sharing.shareAsync(fileUri, {
//                 mimeType: 'text/csv',
//                 dialogTitle: 'Export Expenses CSV',
//             });
//         }
//     },

//     async backupAllData(trips: any[], expenses: any[], settlements: any[]): Promise<void> {
//         const backup = {
//             version: '1.0',
//             exportedAt: new Date().toISOString(),
//             trips,
//             expenses,
//             settlements,
//             preferences: {
//                 achievements: storage.getString('achievements'),
//                 budgetLimits: storage.getString('budget_limits'),
//                 themeMode: storage.getString('themeMode'),
//             },
//         };
//         await this.exportAsJSON(backup, 'tripsplit-full-backup');
//     },
// };
