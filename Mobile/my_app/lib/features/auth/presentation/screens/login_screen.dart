import 'dart:ui'; // ต้องมีตระกูลนี้เข้ามาช่วยทำเอฟเฟกต์ Blur
import 'package:flutter/material.dart';
import '../../../water_garbage_collection/presentation/state/settings_state.dart';
import '../state/auth_state.dart';
import '../../../../core/components/bottom_navigation_layout.dart';
import 'package:my_app/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:my_app/features/auth/data/datasources/secure_storage_service.dart';
import 'pin_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    debugPrint('กำลังเข้าสู่ระบบด้วย: $username');

    if (username.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    // แสดง Dialog Loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: Color(0xFF1E1E1E)),
      ),
    );

    // เรียกใช้งาน Repository เชื่อมต่อไปยังหลังบ้าน Go (mobile_controller/login)
    final authRepository = AuthRepositoryImpl(
      secureStorageService: SecureStorageServiceImpl(),
    );

    final success = await authRepository.login(username, password);

    if (!mounted) return;
    Navigator.of(context).pop(); // ปิด Dialog โหลด

    if (success) {
      AuthState().login();
      final hasPin = await AuthState().isPinSet();
      if (!mounted) return;
      if (hasPin) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const BottomNavigationLayout()),
        );
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const PinScreen(mode: PinMode.create)),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือเชื่อมต่อเซิร์ฟเวอร์ไม่ได้',
          ),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsState = SettingsState();

    return Scaffold(
      body: AnimatedBuilder(
        animation: settingsState,
        builder: (context, child) {
          final isDark = settingsState.isDarkMode;
          final headerColor = isDark ? Colors.white60 : Colors.black54;
          final titleColor = isDark ? Colors.white : const Color(0xFF222222);
          final subTitleColor = isDark ? Colors.white30 : Colors.black38;
          final labelColor = isDark ? Colors.white70 : const Color(0xFF222222);
          final textStyle = TextStyle(
            color: isDark ? Colors.white : Colors.black87,
          );
          final hintStyle = TextStyle(
            color: isDark ? Colors.white30 : Colors.black26,
            fontSize: 14,
          );
          final lineBorderColor = isDark ? Colors.white30 : Colors.black54;

          return Stack(
            children: [
              // 1. พื้นหลังไล่เฉดสี (Gradient Background) ตามธีมที่ตั้งไว้
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: isDark
                        ? [
                            const Color(0xFF0F172A), // Slate เข้มด้านบน
                            const Color(0xFF1E293B), // Slate สว่างขึ้นด้านล่าง
                          ]
                        : [
                            const Color(0xFFD1E4FF), // สีฟ้าอ่อนด้านบน
                            const Color(0xFFE6F0FF), // สีฟ้าจางด้านล่าง
                          ],
                  ),
                ),
              ),

              // 2. แสงเอฟเฟกต์สีฟุ้งกระจายที่มุมขวาบน
              Positioned(
                top: -120,
                right: -120,
                child: Container(
                  width: 350,
                  height: 350,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isDark
                        ? const Color(0x113B82F6) // สีฟ้าจางสำหรับโหมดมืด
                        : const Color(
                            0x33FFF5CC,
                          ), // สีเหลืองอุ่นสำหรับโหมดสว่าง
                  ),
                  child: ClipOval(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 50.0, sigmaY: 50.0),
                      child: Container(color: Colors.transparent),
                    ),
                  ),
                ),
              ),

              // 3. เนื้อหาหลักของฟอร์ม (จัดให้อยู่ตรงกลางจอ และสกรอลล์หลบคีย์บอร์ดได้)
              SafeArea(
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // โลโก้ อบต.ทุ่งหลวง (ทำเป็นวงกลมใส่คำว่า โลโก้ ก่อนใส่โลโก้จริง)
                        Container(
                          width: 140,
                          height: 140,
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: isDark
                                  ? [
                                      const Color(0xFF334155),
                                      const Color(0xFF1E293B),
                                    ]
                                  : [
                                      Colors.white,
                                      const Color(0xFFF1F5F9),
                                    ],
                            ),
                            border: Border.all(
                              color: isDark ? Colors.white24 : Colors.black12,
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: isDark
                                    ? Colors.black.withValues(alpha: 0.3)
                                    : Colors.black.withValues(alpha: 0.05),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'โลโก้',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white70 : Colors.black54,
                              letterSpacing: 1.5,
                            ),
                          ),
                          /* // เมื่อต้องการแสดงโลโก้จริง ให้ลบ child ด้านบน และลบ Comment ส่วนนี้ออก
                          child: ClipOval(
                            child: Image.asset(
                              'assets/tunglaung_logo.png',
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(0xFF1E293B)
                                        : Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Center(
                                    child: Text(
                                      'โลโก้',
                                      style: TextStyle(
                                        color: Colors.grey,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          */
                        ),

                        // ข้อความหัวเรื่อง (Header Text)
                        Text(
                          'องค์การบริหารส่วนตำบล',
                          style: TextStyle(
                            fontSize: 12,
                            color: headerColor,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'ระบบจัดเก็บค่าน้ำและค่าขยะ',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: titleColor,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Subdistrict Administrative Organization',
                          style: TextStyle(
                            fontSize: 10,
                            color: subTitleColor,
                            letterSpacing: 1.0,
                          ),
                        ),

                        const SizedBox(height: 48),

                        // หัวข้อ "เข้าสู่ระบบ" ตัวเล็กกลางจอ
                        Text(
                          'เข้าสู่ระบบ',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: titleColor,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบบริหารจัดการ',
                          style: TextStyle(fontSize: 11, color: subTitleColor),
                        ),

                        const SizedBox(height: 32),

                        // ฟอร์มช่องกรอก: ชื่อผู้ใช้
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ชื่อผู้ใช้',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: labelColor,
                              ),
                            ),
                            TextField(
                              controller: _usernameController,
                              style: textStyle,
                              decoration: InputDecoration(
                                hintText: 'ระบุชื่อผู้ใช้',
                                hintStyle: hintStyle,
                                enabledBorder: UnderlineInputBorder(
                                  borderSide: BorderSide(
                                    color: lineBorderColor,
                                    width: 1.2,
                                  ),
                                ),
                                focusedBorder: const UnderlineInputBorder(
                                  borderSide: BorderSide(
                                    color: Colors.blue,
                                    width: 2.0,
                                  ),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  vertical: 8,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),

                        // ฟอร์มช่องกรอก: รหัสผ่าน
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'รหัสผ่าน',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: labelColor,
                              ),
                            ),
                            TextField(
                              controller: _passwordController,
                              obscureText: true,
                              style: textStyle,
                              decoration: InputDecoration(
                                hintText: 'ระบุรหัสผ่าน',
                                hintStyle: hintStyle,
                                enabledBorder: UnderlineInputBorder(
                                  borderSide: BorderSide(
                                    color: lineBorderColor,
                                    width: 1.2,
                                  ),
                                ),
                                focusedBorder: const UnderlineInputBorder(
                                  borderSide: BorderSide(
                                    color: Colors.blue,
                                    width: 2.0,
                                  ),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  vertical: 8,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 40),

                        // ปุ่มเข้าสู่ระบบ
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isDark
                                  ? Colors.blue[400]!
                                  : const Color(0xFF1E1E1E),
                              foregroundColor: isDark
                                  ? Colors.black
                                  : Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 2,
                            ),
                            onPressed: _handleLogin,
                            child: const Text(
                              'เข้าสู่ระบบ',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
