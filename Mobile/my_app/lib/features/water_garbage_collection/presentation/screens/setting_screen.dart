// Force analyzer update
import 'package:flutter/material.dart';
import '../state/settings_state.dart';
import '../state/printer_state.dart';
import '../state/household_state.dart';
import '../../../auth/presentation/state/auth_state.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import 'printter_screen.dart';
import 'package:my_app/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:my_app/features/auth/data/datasources/secure_storage_service.dart';

class SettingScreen extends StatefulWidget {
  const SettingScreen({super.key});

  @override
  State<SettingScreen> createState() => _SettingScreenState();
}

class _SettingScreenState extends State<SettingScreen> {
  List<dynamic> _waterTiers = [];
  List<dynamic> _garbageRates = [];
  bool _isLoadingRates = true;

  @override
  void initState() {
    super.initState();
    if (AuthState().userProfile == null) {
      AuthState().fetchProfile();
    }
    _loadRates();
  }

  Future<void> _loadRates() async {
    setState(() {
      _isLoadingRates = true;
    });

    try {
      final householdState = HouseholdState();
      final waterTiers = await householdState.fetchWaterUnits();
      final garbageRates = await householdState.fetchGarbageRates();

      setState(() {
        _waterTiers = waterTiers;
        _garbageRates = garbageRates.map((r) => {
          'id': r.id,
          'subdistrict_id': r.subdistrictId,
          'size_name': r.sizeName,
          'cost': r.cost,
        }).toList();
      });
    } catch (e) {
      debugPrint('Error loading rates in setting_screen: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingRates = false;
        });
      }
    }
  }

  void _handleLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('ยืนยันการออกจากระบบ'),
          content: const Text('คุณต้องการออกจากระบบบริหารจัดการค่าน้ำและค่าขยะหรือไม่?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('ยกเลิก'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                Navigator.pop(context); // ปิด Dialog
                
                // ลบ Token ออกจากหน่วยความจำปลอดภัยของเครื่อง
                final authRepository = AuthRepositoryImpl(
                  secureStorageService: SecureStorageServiceImpl(),
                );
                await authRepository.logout();

                AuthState().logout();
                HouseholdState().resetVillagesOnLogout();
                if (context.mounted) {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginScreen()),
                    (route) => false,
                  );
                }
              },
              child: const Text('ออกจากระบบ'),
            ),
          ],
        );
      },
    );
  }


  void _showLanguageSelector(BuildContext context, SettingsState settingsState) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'เลือกภาษาของแอป (Select Language)',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('ภาษาไทย (TH)'),
                trailing: settingsState.currentLanguage == 'ภาษาไทย (TH)'
                    ? const Icon(Icons.check, color: Colors.blue)
                    : null,
                onTap: () {
                  settingsState.setLanguage('ภาษาไทย (TH)');
                  Navigator.pop(context);
                },
              ),
              const Divider(height: 1),
              ListTile(
                title: const Text('English (EN)'),
                trailing: settingsState.currentLanguage == 'English (EN)'
                    ? const Icon(Icons.check, color: Colors.blue)
                    : null,
                onTap: () {
                  settingsState.setLanguage('English (EN)');
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }



  @override
  Widget build(BuildContext context) {
    final settingsState = SettingsState();
    final printerState = PrinterState();
    final authState = AuthState();

    return Scaffold(
      body: AnimatedBuilder(
        animation: Listenable.merge([settingsState, printerState, authState]),
        builder: (context, child) {
          final isDark = settingsState.isDarkMode;
          final cardColor = isDark ? const Color(0xFF1E1E1E) : Colors.white;
          final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
          final subTextColor = isDark ? Colors.grey[400] : Colors.grey;
          final borderSideColor = isDark ? Colors.grey[800]! : Colors.grey[200]!;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. การ์ดผู้ใช้งาน (User Profile Card)
                Card(
                  elevation: 0,
                  color: cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: borderSideColor),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Builder(
                      builder: (context) {
                        if (authState.isLoadingProfile && authState.userProfile == null) {
                          return Row(
                            children: [
                              CircleAvatar(
                                radius: 36,
                                backgroundColor: isDark ? const Color(0xFF262626) : const Color(0xFFEFF6FF),
                                child: const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF3B82F6)),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'กำลังโหลด...',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18,
                                        color: textColor,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'กำลังโหลดข้อมูลโปรไฟล์...',
                                      style: TextStyle(color: subTextColor, fontSize: 13),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          );
                        }

                        if (authState.userProfile == null) {
                          return Row(
                            children: [
                              CircleAvatar(
                                radius: 36,
                                backgroundColor: isDark ? const Color(0xFF262626) : const Color(0xFFEFF6FF),
                                child: const Icon(Icons.error_outline_rounded, size: 40, color: Colors.redAccent),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'ไม่สามารถโหลดข้อมูลได้',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: textColor,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    InkWell(
                                      onTap: () => authState.fetchProfile(),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.refresh, size: 14, color: Colors.blue),
                                          SizedBox(width: 4),
                                          Text(
                                            'ลองใหม่อีกครั้ง',
                                            style: TextStyle(color: Colors.blue, fontSize: 13, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          );
                        }

                        final profile = authState.userProfile!;
                        return Row(
                          children: [
                            CircleAvatar(
                              radius: 36,
                              backgroundColor: isDark ? const Color(0xFF262626) : const Color(0xFFEFF6FF),
                              child: const Icon(Icons.person, size: 40, color: Color(0xFF3B82F6)),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    profile.ownerName,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18,
                                      color: textColor,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    profile.position,
                                    style: TextStyle(color: subTextColor, fontSize: 13),
                                  ),
                                  Text(
                                    'อบต.${profile.subdistrictName} อ.${profile.districtName} จ.${profile.provinceName}',
                                    style: TextStyle(color: subTextColor, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // 2. ตั้งค่าเครื่องพิมพ์ (Printer Connection Settings)
                Text(
                  'การตั้งค่าระบบ (System Settings)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: subTextColor),
                ),
                const SizedBox(height: 8),
                Card(
                  elevation: 0,
                  color: cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: borderSideColor),
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.print_outlined, color: Colors.blue),
                        title: Text('จัดการเครื่องพิมพ์พกพา', style: TextStyle(color: textColor)),
                        subtitle: Text(
                          printerState.isPrinterConnected
                              ? 'เชื่อมต่อกับ: ${printerState.connectedPrinterName}'
                              : 'ยังไม่ได้เชื่อมต่อเครื่องพิมพ์',
                          style: TextStyle(fontSize: 12, color: subTextColor),
                        ),
                        trailing: Icon(Icons.chevron_right, size: 20, color: subTextColor),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const PrinterScreen()),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // 3. การตั้งค่าแอปทั่วไป (General Preferences)
                Text(
                  'การตั้งค่าแอปพลิเคชัน (App Preferences)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: subTextColor),
                ),
                const SizedBox(height: 8),
                Card(
                  elevation: 0,
                  color: cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: borderSideColor),
                  ),
                  child: Column(
                    children: [
                      SwitchListTile(
                        secondary: const Icon(Icons.dark_mode_outlined, color: Colors.indigo),
                        title: Text('โหมดกลางคืน (Dark Mode)', style: TextStyle(color: textColor)),
                        subtitle: Text('ปรับการทำงานเป็นธีมมืดและลดแสง', style: TextStyle(fontSize: 12, color: subTextColor)),
                        value: settingsState.isDarkMode,
                        activeThumbColor: Colors.blue,
                        onChanged: (val) => settingsState.toggleDarkMode(val),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.language, color: Colors.purple),
                        title: Text('ภาษาของระบบ', style: TextStyle(color: textColor)),
                        subtitle: Text(settingsState.currentLanguage, style: TextStyle(fontSize: 12, color: subTextColor)),
                        trailing: Icon(Icons.chevron_right, size: 20, color: subTextColor),
                        onTap: () => _showLanguageSelector(context, settingsState),
                      ),
                      const Divider(height: 1),
                      SwitchListTile(
                        secondary: const Icon(Icons.volume_up_outlined, color: Colors.amber),
                        title: Text('เปิดเสียงเครื่องพิมพ์', style: TextStyle(color: textColor)),
                        subtitle: Text('เล่นเสียงเมื่อพิมพ์ใบแจ้งหนี้/ใบเสร็จสำเร็จ', style: TextStyle(fontSize: 12, color: subTextColor)),
                        value: settingsState.isSoundEnabled,
                        activeThumbColor: Colors.blue,
                        onChanged: (val) => settingsState.toggleSound(val),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // 4. การจัดการข้อมูล (Data Management)
                Text(
                  'การจัดการข้อมูล (Data Management)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: subTextColor),
                ),
                const SizedBox(height: 8),
                Card(
                  elevation: 0,
                  color: cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: borderSideColor),
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.delete_sweep_outlined, color: Colors.redAccent),
                        title: Text('ล้างแคชประวัติการทำงาน', style: TextStyle(color: textColor)),
                        subtitle: Text(settingsState.cacheClearText, style: TextStyle(fontSize: 12, color: subTextColor)),
                        trailing: Icon(Icons.chevron_right, size: 20, color: subTextColor),
                        onTap: () {
                          settingsState.clearCache();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('ล้างข้อมูลแคชประวัติการทำงานเรียบร้อยแล้ว')),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // 5. อัตราค่าธรรมเนียม (Read-Only Rates Details)
                Text(
                  'โครงสร้างอัตราค่าบริการ (Tariff Structures)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: subTextColor),
                ),
                const SizedBox(height: 8),
                Card(
                  elevation: 0,
                  color: cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: borderSideColor),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: _isLoadingRates
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 24.0),
                              child: CircularProgressIndicator(color: Colors.blue),
                            ),
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'อัตราค่าน้ำประปา (อัตราก้าวหน้า):',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor),
                              ),
                              const SizedBox(height: 8),
                              if (_waterTiers.isEmpty)
                                Text('ไม่พบข้อมูลอัตราค่าน้ำ', style: TextStyle(fontSize: 12, color: subTextColor))
                              else
                                ..._waterTiers.map((tier) {
                                  final double start = (tier['start_unit'] as num).toDouble();
                                  final double? end = tier['end_unit'] != null ? (tier['end_unit'] as num).toDouble() : null;
                                  final double cost = (tier['cost'] as num).toDouble();
                                  final rangeText = end != null
                                      ? 'ยูนิตที่ ${start.toStringAsFixed(0)} - ${end.toStringAsFixed(0)}'
                                      : 'ยูนิตที่ ${start.toStringAsFixed(0)} ขึ้นไป';
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 8.0),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(rangeText, style: TextStyle(fontSize: 13, color: textColor)),
                                        Text('฿ ${cost.toStringAsFixed(2)} / หน่วย', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textColor)),
                                      ],
                                    ),
                                  );
                                }),
                              Divider(height: 24, color: borderSideColor),
                              Text(
                                'ค่าบริการจัดเก็บขยะรายเดือน:',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor),
                              ),
                              const SizedBox(height: 8),
                              if (_garbageRates.isEmpty)
                                Text('ไม่พบข้อมูลอัตราค่าขยะ', style: TextStyle(fontSize: 12, color: subTextColor))
                              else
                                ..._garbageRates.map((rate) {
                                  final String name = rate['size_name'] as String? ?? '';
                                  final double cost = (rate['cost'] as num).toDouble();
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 8.0),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(name, style: TextStyle(fontSize: 13, color: textColor)),
                                        Text('฿ ${cost.toStringAsFixed(2)} / เดือน', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textColor)),
                                      ],
                                    ),
                                  );
                                }),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 32),

                // 6. ปุ่มออกจากระบบ (Logout Button)
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.redAccent),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      foregroundColor: Colors.redAccent,
                    ),
                    onPressed: () => _handleLogout(context),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.exit_to_app_outlined),
                        SizedBox(width: 8),
                        Text('ออกจากระบบ', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // ข้อมูลเวอร์ชันแอป
                Center(
                  child: Column(
                    children: [
                      Text(
                        'water and garbage payment service',
                        style: TextStyle(color: subTextColor, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'เวอร์ชัน 1.0.0 (Build 2026.06.01)',
                        style: TextStyle(color: subTextColor, fontSize: 10),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}
