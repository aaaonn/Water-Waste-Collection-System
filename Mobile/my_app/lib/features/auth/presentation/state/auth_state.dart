import 'package:flutter/material.dart';
import '../../domain/entities/user_profile.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../data/datasources/secure_storage_service.dart';

class AuthState extends ChangeNotifier {
  static final AuthState _instance = AuthState._internal();
  factory AuthState() => _instance;
  AuthState._internal();

  bool _isLoggedIn = false;
  bool get isLoggedIn => _isLoggedIn;

  UserProfile? _userProfile;
  UserProfile? get userProfile => _userProfile;

  bool _isLoadingProfile = false;
  bool get isLoadingProfile => _isLoadingProfile;

  void login() {
    _isLoggedIn = true;
    fetchProfile(); // โหลดโปรไฟล์โดยอัตโนมัติเมื่อเข้าสู่ระบบสำเร็จ
    notifyListeners();
  }

  Future<void> logout() async {
    _isLoggedIn = false;
    _userProfile = null;
    _isLoadingProfile = false;
    
    // เคลียร์ข้อมูลทั้งหมดใน Secure Storage รวมถึง token และ pin hash
    final secureStorageService = SecureStorageServiceImpl();
    final authRepository = AuthRepositoryImpl(
      secureStorageService: secureStorageService,
    );
    await authRepository.logout();
    await secureStorageService.clearAll();
    
    notifyListeners();
  }

  // ตรวจสอบว่าได้ตั้งรหัส PIN หรือยัง
  Future<bool> isPinSet() async {
    final secureStorage = SecureStorageServiceImpl();
    final pinHash = await secureStorage.read('app_pin_hash');
    return pinHash != null && pinHash.isNotEmpty;
  }

  // เข้ารหัส PIN 6 หลักด้วย DJB2 algorithm แบบ Pure Dart
  String _hashPin(String pin) {
    int hash = 5381;
    for (int i = 0; i < pin.length; i++) {
      hash = ((hash << 5) + hash) + pin.codeUnitAt(i);
      hash = hash & 0xFFFFFFFF; // รักษาขอบเขตให้อยู่ใน 32-bit unsigned int
    }
    return hash.toRadixString(16);
  }

  // บันทึกรหัส PIN ลงใน Secure Storage
  Future<void> setPin(String pin) async {
    final secureStorage = SecureStorageServiceImpl();
    final hash = _hashPin(pin);
    await secureStorage.write('app_pin_hash', hash);
  }

  // ตรวจสอบรหัส PIN
  Future<bool> verifyPin(String pin) async {
    final secureStorage = SecureStorageServiceImpl();
    final savedHash = await secureStorage.read('app_pin_hash');
    if (savedHash == null) return false;
    return savedHash == _hashPin(pin);
  }

  // ลบรหัส PIN
  Future<void> clearPin() async {
    final secureStorage = SecureStorageServiceImpl();
    await secureStorage.delete('app_pin_hash');
  }

  Future<void> fetchProfile() async {
    if (_isLoadingProfile) return;
    _isLoadingProfile = true;
    notifyListeners();

    try {
      final authRepository = AuthRepositoryImpl(
        secureStorageService: SecureStorageServiceImpl(),
      );
      final profile = await authRepository.getProfile();
      if (profile != null) {
        _userProfile = profile;
      }
    } catch (e) {
      debugPrint('fetchProfile: Error fetching profile: $e');
    } finally {
      _isLoadingProfile = false;
      notifyListeners();
    }
  }
}
