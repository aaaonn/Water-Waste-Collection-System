import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'network_info.dart';
import '../../../features/water_garbage_collection/presentation/state/settings_state.dart';

class NetworkCheckWrapper extends StatefulWidget {
  final Widget child;
  const NetworkCheckWrapper({super.key, required this.child});

  @override
  State<NetworkCheckWrapper> createState() => _NetworkCheckWrapperState();
}

class _NetworkCheckWrapperState extends State<NetworkCheckWrapper> with SingleTickerProviderStateMixin {
  final NetworkInfo _networkInfo = NetworkInfoImpl();
  late StreamSubscription<bool> _connectionSubscription;
  bool _isConnected = true;
  bool _isChecking = false;

  // สำหรับการกระพริบ (Pulsating) ของไอคอนออฟไลน์
  late AnimationController _pulsateController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();

    // ตั้งค่าอนิเมชั่นไอคอนกระพริบเบาๆ เพื่อความสวยงามพรีเมียม
    _pulsateController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _pulsateController, curve: Curves.easeInOut),
    );

    // ตรวจสอบสัญญาณเครือข่ายเบื้องต้นตอนเริ่มแอป
    _checkInitialConnection();

    // เฝ้าฟังการเปลี่ยนแปลงของสถานะเน็ตแบบเรียลไทม์
    _connectionSubscription = _networkInfo.onConnectionChanged.listen((isConnected) {
      if (mounted) {
        setState(() {
          _isConnected = isConnected;
        });
      }
    });
  }

  @override
  void dispose() {
    _connectionSubscription.cancel();
    _pulsateController.dispose();
    super.dispose();
  }

  Future<void> _checkInitialConnection() async {
    final connected = await _networkInfo.isConnected;
    if (mounted) {
      setState(() {
        _isConnected = connected;
      });
    }
  }

  // ฟังก์ชันเช็คการเชื่อมต่ออีกครั้งเมื่อผู้ใช้กดปุ่ม "ลองอีกครั้ง"
  Future<void> _handleRetry() async {
    if (_isChecking) return;

    setState(() {
      _isChecking = true;
    });
    HapticFeedback.mediumImpact();

    // ดีเลย์นิดหน่อยเพื่อให้หน้าจอแสดงอนิเมชั่นโหลดสถานะดูนุ่มนวล
    await Future.delayed(const Duration(milliseconds: 800));
    final connected = await _networkInfo.isConnected;

    if (mounted) {
      setState(() {
        _isConnected = connected;
        _isChecking = false;
      });

      if (connected) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.wifi, color: Colors.white),
                SizedBox(width: 8),
                Text('เชื่อมต่ออินเทอร์เน็ตสำเร็จแล้ว'),
              ],
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      } else {
        HapticFeedback.vibrate();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isConnected) {
      return widget.child;
    }

    final settingsState = SettingsState();
    return AnimatedBuilder(
      animation: settingsState,
      builder: (context, child) {
        final isDark = settingsState.isDarkMode;
        
        // กำหนดเฉดสีตามธีมหลักของแอป (โทนสีฟ้า-น้ำเงินพาสเทล)
        final bgGradient = isDark
            ? const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF0F172A), // Slate เข้มสุด
                  Color(0xFF1E293B), // Slate สว่างขึ้น
                  Color(0xFF111827), // ดำด้านล่าง
                ],
              )
            : const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFFD1E4FF), // สีฟ้าอ่อนหลักของแอป
                  Color(0xFFE6F0FF), // สีฟ้าพาสเทลจาง
                  Colors.white,
                ],
              );
              
        final glowColor = isDark 
            ? const Color(0x183B82F6) // สีฟ้าเรืองแสงจางๆ ในโหมดมืด
            : const Color(0x283B82F6); // สีฟ้าเรืองแสงในโหมดสว่าง

        final cardBgColor = isDark
            ? Colors.white.withValues(alpha: 0.06)
            : Colors.white.withValues(alpha: 0.75);

        final borderColor = isDark
            ? Colors.white.withValues(alpha: 0.12)
            : Colors.blue.withValues(alpha: 0.2);

        final titleColor = isDark ? Colors.white : const Color(0xFF1E293B);
        final textColor = isDark ? Colors.white70 : Colors.black87;
        
        final iconBgColor = isDark
            ? Colors.blue[900]!.withValues(alpha: 0.2)
            : Colors.blue[50]!;
            
        final iconBorderColor = isDark
            ? Colors.blue[700]!.withValues(alpha: 0.4)
            : Colors.blue[200]!;

        final primaryColor = Colors.blue[600]!;

        final btnBgColor = isDark ? Colors.white : const Color(0xFF1E1E1E);
        final btnTextColor = isDark ? const Color(0xFF0F172A) : Colors.white;

        return Scaffold(
          body: Stack(
            children: [
              // 1. พื้นหลังไล่โทนสีตามธีมหลักของแอป
              Container(
                decoration: BoxDecoration(
                  gradient: bgGradient,
                ),
              ),
              
              // 2. แสงเรืองแสงสีฟ้าเพื่อสร้างมิติ
              Positioned(
                top: 100,
                left: -50,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: glowColor,
                  ),
                  child: ClipOval(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 80.0, sigmaY: 80.0),
                      child: Container(color: Colors.transparent),
                    ),
                  ),
                ),
              ),

              // 3. การ์ดข้อความและการโต้ตอบ (Centered Glassmorphism Card)
              SafeArea(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32.0),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 16.0, sigmaY: 16.0),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
                          decoration: BoxDecoration(
                            color: cardBgColor,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: borderColor,
                              width: 1.5,
                            ),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // ไอคอน Wifi Off พร้อมอนิเมชั่นกระพริบ
                              AnimatedBuilder(
                                animation: _pulseAnimation,
                                builder: (context, child) {
                                  return Opacity(
                                    opacity: _pulseAnimation.value,
                                    child: Container(
                                      padding: const EdgeInsets.all(20),
                                      decoration: BoxDecoration(
                                        color: iconBgColor,
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: iconBorderColor,
                                          width: 2,
                                        ),
                                      ),
                                      child: Icon(
                                        Icons.wifi_off_rounded,
                                        size: 64,
                                        color: primaryColor,
                                      ),
                                    ),
                                  );
                                },
                              ),
                              const SizedBox(height: 32),
                              
                              // ข้อความแจ้งเตือนหัวข้อหลัก
                              Text(
                                'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: titleColor,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 12),
                              
                              // ข้อความรายละเอียด
                              Text(
                                'เนื่องจากแอปพลิเคชันนี้ได้รับการตั้งค่าให้ทำงานออนไลน์แบบเรียลไทม์เท่านั้น กรุณาตรวจสอบสัญญาณ Wi-Fi หรือข้อมูลมือถือของท่านเพื่อเปิดใช้งานระบบ',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: textColor,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 40),
                              
                              // ปุ่มลองใหม่อีกครั้ง / เช็คสถานะ
                              SizedBox(
                                width: double.infinity,
                                height: 48,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _isChecking 
                                        ? (isDark ? Colors.white24 : Colors.black26) 
                                        : btnBgColor,
                                    foregroundColor: btnTextColor,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    elevation: 0,
                                  ),
                                  onPressed: _isChecking ? null : _handleRetry,
                                  child: _isChecking
                                      ? SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            color: isDark ? Colors.white : Colors.black87,
                                            strokeWidth: 2,
                                          ),
                                        )
                                      : const Text(
                                          'ตรวจสอบอีกครั้ง',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
