import 'package:flutter/material.dart';
import 'household_state.dart';

class SettingsState extends ChangeNotifier {
  static final SettingsState _instance = SettingsState._internal();
  factory SettingsState() => _instance;
  SettingsState._internal();

  bool _isDarkMode = false;
  bool get isDarkMode => _isDarkMode;

  void toggleDarkMode(bool value) {
    _isDarkMode = value;
    notifyListeners();
  }

  String _currentLanguage = 'ภาษาไทย (TH)';
  String get currentLanguage => _currentLanguage;

  void setLanguage(String value) {
    _currentLanguage = value;
    notifyListeners();
  }

  bool _isSoundEnabled = true;
  bool get isSoundEnabled => _isSoundEnabled;

  void toggleSound(bool value) {
    _isSoundEnabled = value;
    notifyListeners();
  }

  DateTime? _lastSyncTime = DateTime.now().subtract(const Duration(minutes: 15));
  DateTime? get lastSyncTime => _lastSyncTime;

  bool get hasUnsyncedChanges => HouseholdState().hasUnsyncedChanges;

  int _cachedPrintJobs = 2;
  int get cachedPrintJobs => _cachedPrintJobs;

  DateTime? _lastCacheClearTime;
  DateTime? get lastCacheClearTime => _lastCacheClearTime;

  String get lastSyncText {
    if (_lastSyncTime == null) return 'ยังไม่ได้ซิงค์ข้อมูล';
    if (hasUnsyncedChanges) return 'มีข้อมูลใหม่ยังไม่ได้ซิงค์ (รอกดซิงค์)';
    final diff = DateTime.now().difference(_lastSyncTime!);
    if (diff.inSeconds < 10) return 'ซิงค์ล่าสุดเมื่อสักครู่';
    if (diff.inMinutes < 1) return 'ซิงค์ล่าสุดเมื่อไม่กี่วินาทีที่แล้ว';
    return 'ซิงค์ล่าสุดเมื่อ ${diff.inMinutes} นาทีที่แล้ว';
  }

  String get cacheClearText {
    if (_cachedPrintJobs == 0) {
      if (_lastCacheClearTime != null) return 'ล้างแคชล่าสุดเมื่อสักครู่';
      return 'แคชประวัติว่างเปล่า';
    }
    return 'มีไฟล์ประวัติแคชพิมพ์สะสม: $_cachedPrintJobs รายการ';
  }

  Future<void> syncData() async {
    await HouseholdState().triggerSync();
    _lastSyncTime = DateTime.now();
    notifyListeners();
  }

  void clearCache() {
    _cachedPrintJobs = 0;
    _lastCacheClearTime = DateTime.now();
    notifyListeners();
  }

  void markUnsynced() {
    // Deprecated, status tracked in SyncService
    notifyListeners();
  }

  void incrementPrintJob() {
    _cachedPrintJobs++;
    notifyListeners();
  }
}
