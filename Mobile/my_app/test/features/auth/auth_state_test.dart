import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/auth/presentation/state/auth_state.dart';
import 'package:my_app/features/auth/data/datasources/secure_storage_service.dart';

void main() {
  group('AuthState Tests', () {
    late AuthState authState;

    setUp(() async {
      authState = AuthState();
      
      // ใช้ clearAll() แทนการลบไฟล์จริง เพื่อป้องกันปัญหา OS Error 32 (File Locked) บน Windows
      await SecureStorageServiceImpl().clearAll();
      
      // ต้องใส่ await เพื่อรอให้กระบวนการล้างข้อมูลของ logout ทำงานเสร็จ ป้องกัน Race Condition
      await authState.logout();
    });

    tearDown(() async {
      await SecureStorageServiceImpl().clearAll();
    });

    test('initial state values are correct', () async {
      expect(authState.isLoggedIn, false);
      expect(authState.userProfile, isNull);
      expect(authState.isLoadingProfile, false);
      expect(await authState.isPinSet(), false);
    });

    test('setting and verifying PIN works correctly with DJB2 Hashing', () async {
      // 1. ตั้ง PIN ใหม่
      await authState.setPin('123456');
      expect(await authState.isPinSet(), true);

      // 2. ตรวจสอบ PIN ที่ถูกต้อง
      final correctVerify = await authState.verifyPin('123456');
      expect(correctVerify, true);

      // 3. ตรวจสอบ PIN ที่ไม่ถูกต้อง
      final incorrectVerify = await authState.verifyPin('111111');
      expect(incorrectVerify, false);
    });

    test('logout clears login state and PIN from storage', () async {
      // 1. จำลองการล็อกอินและตั้ง PIN
      authState.login();
      await authState.setPin('999999');

      expect(authState.isLoggedIn, true);
      expect(await authState.isPinSet(), true);

      // 2. ออกจากระบบ
      await authState.logout();

      // 3. ยืนยันสถานะที่ถูกเคลียร์
      expect(authState.isLoggedIn, false);
      expect(authState.userProfile, isNull);
      expect(await authState.isPinSet(), false);
    });

    test('clearPin removes only PIN from storage', () async {
      await authState.setPin('123456');
      expect(await authState.isPinSet(), true);

      await authState.clearPin();
      expect(await authState.isPinSet(), false);
    });
  });
}
