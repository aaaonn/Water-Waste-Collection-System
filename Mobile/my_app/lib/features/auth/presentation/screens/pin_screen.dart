import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/components/bottom_navigation_layout.dart';
import '../../../water_garbage_collection/presentation/state/settings_state.dart';
import '../state/auth_state.dart';
import 'login_screen.dart';

enum PinMode { create, unlock }

class PinScreen extends StatefulWidget {
  final PinMode mode;
  const PinScreen({super.key, required this.mode});

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> {
  String _enteredPin = '';
  String _firstEnteredPin = '';
  bool _isConfirming = false;
  String _errorMessage = '';
  
  // โหมดการทำงานปัจจุบันที่หน้าจอกำลังแสดง (อาจเปลี่ยนตามขั้นตอนการตั้งค่า PIN)
  late PinMode _currentMode;

  @override
  void initState() {
    super.initState();
    _currentMode = widget.mode;
  }

  void _onNumberPressed(int number) {
    if (_enteredPin.length < 6) {
      setState(() {
        _enteredPin += number.toString();
        _errorMessage = '';
      });
      HapticFeedback.lightImpact();

      if (_enteredPin.length == 6) {
        // ให้หน่วงเวลาเล็กน้อยเพื่อให้ผู้ใช้เห็นจุดวงกลมจุดสุดท้ายสว่างขึ้นก่อนทำการประมวลผล
        Future.delayed(const Duration(milliseconds: 250), _handlePinComplete);
      }
    }
  }

  void _onBackspacePressed() {
    if (_enteredPin.isNotEmpty) {
      setState(() {
        _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
        _errorMessage = '';
      });
      HapticFeedback.lightImpact();
    }
  }

  Future<void> _handlePinComplete() async {
    final authState = AuthState();

    if (_currentMode == PinMode.create) {
      if (!_isConfirming) {
        // ขั้นตอนที่ 1: รับรหัสครั้งแรกสำเร็จ -> นำไปเก็บไว้ และเริ่มขั้นตอนยืนยัน
        setState(() {
          _firstEnteredPin = _enteredPin;
          _enteredPin = '';
          _isConfirming = true;
        });
        HapticFeedback.mediumImpact();
      } else {
        // ขั้นตอนที่ 2: รับรหัสรอบยืนยันสำเร็จ -> เปรียบเทียบผลลัพธ์
        if (_enteredPin == _firstEnteredPin) {
          // รหัสผ่านทั้งสองรอบตรงกัน -> บันทึกลง Secure Storage
          await authState.setPin(_enteredPin);
          
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 8),
                  Text('ตั้งรหัส PIN และเปิดใช้งานเซสชันเรียบร้อย'),
                ],
              ),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
          
          // นำทางไปยังหน้าจอหลัก
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const BottomNavigationLayout()),
          );
        } else {
          // รหัสไม่ตรงกัน -> สั่นเตือน และเคลียร์ค่ารอบยืนยัน
          setState(() {
            _enteredPin = '';
            _errorMessage = 'รหัส PIN ไม่ตรงกัน กรุณาตั้งรหัสใหม่อีกครั้ง';
          });
          HapticFeedback.vibrate();
        }
      }
    } else {
      // โหมด Unlock: ตรวจสอบ PIN ที่ป้อน
      final isValid = await authState.verifyPin(_enteredPin);
      if (isValid) {
        // ดึงโปรไฟล์และเข้าสู่หน้าจอหลัก
        await authState.fetchProfile();
        
        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const BottomNavigationLayout()),
        );
      } else {
        // รหัสผิดพลาด -> สั่นเตือน และเคลียร์ค่า
        setState(() {
          _enteredPin = '';
          _errorMessage = 'รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
        });
        HapticFeedback.vibrate();
      }
    }
  }

  // ล้างการตั้งค่า PIN ในโหมด Create และเริ่มใหม่
  void _resetSetupFlow() {
    setState(() {
      _enteredPin = '';
      _firstEnteredPin = '';
      _isConfirming = false;
      _errorMessage = '';
    });
    HapticFeedback.mediumImpact();
  }

  // จัดการกรณีลืม PIN หรือเปลี่ยนบัญชี (Logout ออกจากระบบ)
  Future<void> _handleForgotPinOrReset() async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ออกจากระบบ'),
        content: const Text(
          'คุณต้องการลบรหัส PIN และออกจากระบบเพื่อเข้าใช้งานด้วยบัญชีอื่นหรือไม่?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('ยกเลิก', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('ออกจากระบบ', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await AuthState().logout();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
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
          final titleColor = isDark ? Colors.white : const Color(0xFF1E293B);
          final subTitleColor = isDark ? Colors.white70 : Colors.black54;
          
          // กำหนดคำอธิบายตามขั้นตอนและโหมด
          String titleText = '';
          String subTitleText = '';
          if (_currentMode == PinMode.create) {
            if (!_isConfirming) {
              titleText = 'ตั้งรหัส PIN';
              subTitleText = 'กำหนดรหัส PIN 6 หลักเพื่อความปลอดภัยในการเข้าใช้งาน';
            } else {
              titleText = 'ยืนยันรหัส PIN';
              subTitleText = 'กรุณากรอกรหัส PIN 6 หลักเดิมอีกครั้งเพื่อความถูกต้อง';
            }
          } else {
            titleText = 'กรอกรหัส PIN';
            subTitleText = 'กรุณาใส่รหัส PIN 6 หลักเพื่อปลดล็อคเข้าสู่แอปพลิเคชัน';
          }

          return Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark
                    ? [const Color(0xFF0F172A), const Color(0xFF1E293B)]
                    : [const Color(0xFFD1E4FF), const Color(0xFFE6F0FF)],
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  const SizedBox(height: 40),
                  // ส่วนหัว: โลโก้ หรือ ไอคอนล็อก
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: Icon(
                        _currentMode == PinMode.create 
                            ? Icons.security_outlined 
                            : Icons.lock_open_outlined,
                        size: 40,
                        color: Colors.blue[600],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // ข้อความหัวข้อ
                  Text(
                    titleText,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: titleColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40.0),
                    child: Text(
                      subTitleText,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: subTitleColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // จุดแสดงผล PIN 6 หลัก
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(6, (index) {
                      final isFilled = index < _enteredPin.length;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        margin: const EdgeInsets.symmetric(horizontal: 10),
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isFilled
                              ? Colors.blue[600]
                              : (isDark ? Colors.white24 : Colors.black12),
                          border: Border.all(
                            color: isFilled
                                ? Colors.blue[600]!
                                : (isDark ? Colors.white30 : Colors.black26),
                            width: 1.5,
                          ),
                          boxShadow: isFilled
                              ? [
                                  BoxShadow(
                                    color: Colors.blue.withValues(alpha: 0.4),
                                    blurRadius: 6,
                                    spreadRadius: 1,
                                  ),
                                ]
                              : [],
                        ),
                      );
                    }),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // แสดงข้อความเตือนความผิดพลาด
                  Container(
                    height: 24,
                    alignment: Alignment.center,
                    child: _errorMessage.isNotEmpty
                        ? Text(
                            _errorMessage,
                            style: const TextStyle(
                              color: Colors.redAccent,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          )
                        : null,
                  ),

                  const Spacer(),

                  // แผงปุ่มตัวเลข (Number Pad Grid)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 48.0),
                    child: Column(
                      children: [
                        _buildKeyboardRow([1, 2, 3], isDark),
                        const SizedBox(height: 16),
                        _buildKeyboardRow([4, 5, 6], isDark),
                        const SizedBox(height: 16),
                        _buildKeyboardRow([7, 8, 9], isDark),
                        const SizedBox(height: 16),
                        _buildKeyboardBottomRow(isDark),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // ปุ่มช่วยเหลือด้านล่างสุด
                  if (_currentMode == PinMode.unlock)
                    TextButton.icon(
                      onPressed: _handleForgotPinOrReset,
                      icon: const Icon(Icons.logout, size: 16, color: Colors.blue),
                      label: const Text(
                        'ลืมรหัส PIN หรือสลับบัญชีอื่น',
                        style: TextStyle(
                          color: Colors.blue,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    )
                  else if (_isConfirming)
                    TextButton.icon(
                      onPressed: _resetSetupFlow,
                      icon: const Icon(Icons.refresh, size: 16, color: Colors.blue),
                      label: const Text(
                        'ตั้งค่าใหม่ตั้งแต่ต้น',
                        style: TextStyle(
                          color: Colors.blue,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // สร้างแถวของปุ่มตัวเลข
  Widget _buildKeyboardRow(List<int> numbers, bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: numbers.map((number) => _buildNumberButton(number, isDark)).toList(),
    );
  }

  // สร้างแถวปุ่มล่างสุดของแผงคีย์บอร์ด (ปุ่มลบ + 0 + ปุ่มซ้ายว่างหรือย้อนกลับ)
  Widget _buildKeyboardBottomRow(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // ปุ่มซ้ายล่างว่างเปล่าเพื่อให้โครงสร้างแผงปุ่มสมมาตร
        const SizedBox(width: 70, height: 70),
        _buildNumberButton(0, isDark),
        _buildBackspaceButton(isDark),
      ],
    );
  }

  // ปุ่มตัวเลขเดี่ยว
  Widget _buildNumberButton(int number, bool isDark) {
    final buttonColor = isDark 
        ? Colors.white.withValues(alpha: 0.07) 
        : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF1E293B);

    return InkWell(
      onTap: () => _onNumberPressed(number),
      borderRadius: BorderRadius.circular(35),
      child: Container(
        width: 70,
        height: 70,
        decoration: BoxDecoration(
          color: buttonColor,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: Text(
          number.toString(),
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ),
    );
  }

  // ปุ่มลบล่าสุด (Backspace)
  Widget _buildBackspaceButton(bool isDark) {
    final iconColor = isDark ? Colors.white70 : const Color(0xFF1E293B);

    return InkWell(
      onTap: _onBackspacePressed,
      borderRadius: BorderRadius.circular(35),
      child: SizedBox(
        width: 70,
        height: 70,
        child: Icon(
          Icons.backspace_outlined,
          size: 24,
          color: iconColor,
        ),
      ),
    );
  }
}
