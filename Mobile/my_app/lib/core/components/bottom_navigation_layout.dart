import 'package:flutter/material.dart';
import 'main_appbar.dart';
import '../../features/water_garbage_collection/presentation/screens/home_screen.dart';
import '../../features/water_garbage_collection/presentation/screens/househole_list_screen.dart';
import '../../features/water_garbage_collection/presentation/screens/setting_screen.dart';

class BottomNavigationLayout extends StatefulWidget {
  const BottomNavigationLayout({super.key});

  @override
  State<BottomNavigationLayout> createState() => _BottomNavigationLayoutState();
}

class _BottomNavigationLayoutState extends State<BottomNavigationLayout> {
  int _currentIndex = 0;
  final List<Widget> _pages = [
    const HomeScreen(),
    const HouseholdListScreen(),
    const SettingScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const MainAppBar(), // เรียกใช้ Headbar ที่เราสร้างไว้ในโฟลเดอร์เดียวกัน
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF3B82F6), // สีน้ำเงินตามรูป
        unselectedItemColor: Colors.grey,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment_outlined), label: 'Tasks'),
          BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), label: 'Settings'),
        ],
      ),
    );
  }
}
