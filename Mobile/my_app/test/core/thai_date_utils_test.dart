import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/utils/thai_date_utils.dart';

void main() {
  group('ThaiDateUtils Tests', () {
    test('kThaiMonthMap contains all 12 Thai months with correct values', () {
      expect(ThaiDateUtils.kThaiMonthMap.length, 12);
      expect(ThaiDateUtils.kThaiMonthMap['มกราคม'], 1);
      expect(ThaiDateUtils.kThaiMonthMap['กุมภาพันธ์'], 2);
      expect(ThaiDateUtils.kThaiMonthMap['มีนาคม'], 3);
      expect(ThaiDateUtils.kThaiMonthMap['เมษายน'], 4);
      expect(ThaiDateUtils.kThaiMonthMap['พฤษภาคม'], 5);
      expect(ThaiDateUtils.kThaiMonthMap['มิถุนายน'], 6);
      expect(ThaiDateUtils.kThaiMonthMap['กรกฎาคม'], 7);
      expect(ThaiDateUtils.kThaiMonthMap['สิงหาคม'], 8);
      expect(ThaiDateUtils.kThaiMonthMap['กันยายน'], 9);
      expect(ThaiDateUtils.kThaiMonthMap['ตุลาคม'], 10);
      expect(ThaiDateUtils.kThaiMonthMap['พฤศจิกายน'], 11);
      expect(ThaiDateUtils.kThaiMonthMap['ธันวาคม'], 12);
    });

    test('mapSizeKey maps sizes correctly', () {
      // 20L cases
      expect(ThaiDateUtils.mapSizeKey('ถังขยะ 20L'), '20L');
      expect(ThaiDateUtils.mapSizeKey('ถังขยะขนาด 20 ลิตร'), '20L');

      // 60L cases
      expect(ThaiDateUtils.mapSizeKey('ถังขยะ 50L'), '60L');
      expect(ThaiDateUtils.mapSizeKey('ถังขยะ 60L'), '60L');
      expect(ThaiDateUtils.mapSizeKey('ถังขยะขนาด 60 ลิตร'), '60L');

      // 120L cases
      expect(ThaiDateUtils.mapSizeKey('ถังขยะ 100L'), '120L');
      expect(ThaiDateUtils.mapSizeKey('ถังขยะ 120L'), '120L');
      expect(ThaiDateUtils.mapSizeKey('ถังขยะขนาด 120 ลิตร'), '120L');

      // Default fallback cases
      expect(ThaiDateUtils.mapSizeKey('ถังขยะแบบแปลกๆ'), 'ถังขยะแบบแปลกๆ');
      expect(ThaiDateUtils.mapSizeKey('ถังขยะ 10L'), 'ถังขยะ 10L');
    });
  });
}
