import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/auth/data/datasources/secure_storage_service.dart';

void main() {
  group('SecureStorageServiceImpl Tests', () {
    late SecureStorageServiceImpl service;

    setUp(() async {
      service = SecureStorageServiceImpl();
      // ใช้ clearAll() แทนการลบไฟล์จริงเพื่อความปลอดภัยและป้องกันปัญหากระบวนการล็อกไฟล์บน Windows
      await service.clearAll();
    });

    tearDown(() async {
      await service.clearAll();
    });

    test('write and read string values correctly', () async {
      await service.write('token', 'sample-jwt-token-xyz');
      final token = await service.read('token');
      expect(token, 'sample-jwt-token-xyz');
      
      await service.write('username', 'somchai');
      final username = await service.read('username');
      expect(username, 'somchai');
    });

    test('delete removes specified key only', () async {
      await service.write('key1', 'value1');
      await service.write('key2', 'value2');

      await service.delete('key1');

      expect(await service.read('key1'), isNull);
      expect(await service.read('key2'), 'value2');
    });

    test('clearAll removes all keys from store', () async {
      await service.write('token', 'xyz');
      await service.write('app_pin_hash', 'abcdef');

      await service.clearAll();

      expect(await service.read('token'), isNull);
      expect(await service.read('app_pin_hash'), isNull);
    });
  });
}
