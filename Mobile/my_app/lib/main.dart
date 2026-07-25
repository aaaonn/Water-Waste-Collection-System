import 'package:flutter/material.dart';
import 'features/water_garbage_collection/presentation/state/settings_state.dart';
import 'features/auth/presentation/state/auth_state.dart';
// 🌟 1. Import หน้าจอต่างๆ ที่เราเขียนแยกไฟล์ไว้เข้ามา
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/auth/presentation/screens/pin_screen.dart';
import 'package:my_app/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:my_app/features/auth/data/datasources/secure_storage_service.dart';
import 'core/services/network/network_check_wrapper.dart';

void main() async {
  // สั่งให้การตั้งค่าเริ่มต้นของ Flutter ทำงานให้เสร็จก่อนเปิดจอ
  WidgetsFlutterBinding.ensureInitialized();

  // คำนวณหน้าจอเริ่มต้นตามสถานะการเข้าสู่ระบบและรหัส PIN
  Widget initialScreen = await getInitialScreen();

  // รันแอปพลิเคชันหลัก
  runApp(
    MyApp(
      initialScreen: initialScreen,
    ),
  );
}

class MyApp extends StatelessWidget {
  final Widget initialScreen;

  // รับค่าเข้ามาจากฟังก์ชัน main ว่าจะให้เปิดที่หน้าไหน
  const MyApp({super.key, required this.initialScreen});

  @override
  Widget build(BuildContext context) {
    final settingsState = SettingsState();
    return AnimatedBuilder(
      animation: settingsState,
      builder: (context, child) {
        final isDark = settingsState.isDarkMode;
        return MaterialApp(
          title: 'ระบบจัดเก็บค่าน้ำและค่าขยะ อบต.ทุ่งหลวง',
          debugShowCheckedModeBanner: false, // ปิดแถบคาดสีแดงที่มุมขวาบน
          builder: (context, child) {
            return NetworkCheckWrapper(child: child!);
          },
          // 🌟 2. การตกแต่ง/กำหนดธีมสีหลักของทั้งแอปพลิเคชันที่นี่
          theme: ThemeData(
            useMaterial3: true,
            brightness: isDark ? Brightness.dark : Brightness.light,
            scaffoldBackgroundColor: isDark
                ? const Color(0xFF121212)
                : const Color(0xFFF8FAFC),
            cardColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            dividerColor: isDark
                ? const Color(0xFF2D2D2D)
                : const Color(0xFFE2E8F0),
            appBarTheme: AppBarTheme(
              backgroundColor: isDark ? const Color(0xFF121212) : Colors.white,
              foregroundColor: isDark ? Colors.white : const Color(0xFF1E293B),
              elevation: 0,
            ),
            colorScheme: ColorScheme.fromSeed(
              brightness: isDark ? Brightness.dark : Brightness.light,
              seedColor: const Color(0xFFD1E4FF), // ใช้สีฟ้าอ่อนเป็นโทนสีหลัก
              primary: isDark ? Colors.blue[400]! : const Color(0xFF1E1E1E),
              surface: isDark ? const Color(0xFF1E1E1E) : Colors.white,
              onSurface: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            fontFamily: 'Sukumvit', // ตัวอย่างการตั้งฟอนต์ภาษาไทยของแอป (ถ้ามี)
          ),

          // 🌟 3. สั่งให้แสดงผลหน้าแรกตามเงื่อนไขที่คำนวณไว้ข้างบน
          home: initialScreen,
        );
      },
    );
  }
}

// 🛠️ ฟังก์ชันกำหนดหน้าจอเริ่มต้นตามสถานะเซสชันและรหัส PIN
Future<Widget> getInitialScreen() async {
  final secureStorage = SecureStorageServiceImpl();
  final authRepository = AuthRepositoryImpl(
    secureStorageService: secureStorage,
  );
  
  final loggedIn = await authRepository.isLoggedIn();
  if (loggedIn) {
    AuthState().login(); // ซิงค์สถานะเข้ากับระบบนำทางของ AuthState
    
    // ตรวจสอบว่าผู้ใช้ตั้งรหัส PIN แล้วหรือยัง
    final hasPin = await AuthState().isPinSet();
    if (hasPin) {
      return const PinScreen(mode: PinMode.unlock);
    } else {
      return const PinScreen(mode: PinMode.create);
    }
  }
  return const LoginScreen();
}
