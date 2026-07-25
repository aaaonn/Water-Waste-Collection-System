import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/auth/presentation/screens/login_screen.dart';

void main() {
  testWidgets('LoginScreen smoke test', (WidgetTester tester) async {
    // ปั๊มหน้าจอ LoginScreen ขึ้นมาจำลอง
    await tester.pumpWidget(
      const MaterialApp(
        home: LoginScreen(),
      ),
    );

    // ตรวจสอบว่าพบหัวข้อและฟิลด์ที่จำเป็นบนหน้าจอเข้าสู่ระบบ
    expect(find.text('เข้าสู่ระบบ'), findsNWidgets(2)); // หัวข้อหลักและข้อความบนปุ่ม
    expect(find.text('ชื่อผู้ใช้'), findsOneWidget);
    expect(find.text('รหัสผ่าน'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
  });
}
