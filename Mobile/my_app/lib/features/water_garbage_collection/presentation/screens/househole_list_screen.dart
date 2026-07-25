import 'package:flutter/material.dart';
import '../state/household_state.dart';
import '../../domain/entities/household.dart';
import 'record_screen.dart';
import 'payment_screen.dart';

class HouseholdListScreen extends StatefulWidget {
  const HouseholdListScreen({super.key});

  @override
  State<HouseholdListScreen> createState() => _HouseholdListScreenState();
}

class _HouseholdListScreenState extends State<HouseholdListScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedStatus =
      'all'; // 'all', 'notSurveyed', 'surveyedUnpaid', 'paid'
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    HouseholdState().fetchVillages();
    HouseholdState().fetchHouseholds();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = HouseholdState();
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: AnimatedBuilder(
        animation: appState,
        builder: (context, child) {
          var filteredList = appState.getFilteredHouseholds(_searchQuery);
          if (_selectedStatus != 'all') {
            filteredList = filteredList.where((h) {
              if (_selectedStatus == 'notSurveyed') {
                return h.status == HouseholdStatus.notSurveyed;
              } else if (_selectedStatus == 'surveyedUnpaid') {
                return h.status == HouseholdStatus.surveyedUnpaid;
              } else {
                return h.status == HouseholdStatus.paid;
              }
            }).toList();
          }

          return Column(
            children: [
              // ตัวกรองและกล่องค้นหาด้านบน
              Container(
                color: theme.cardColor,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ตัวกรองหมู่บ้าน และ รอบเดือน
                    _buildDropdownSelector(
                      context,
                      icon: Icons.home_work_outlined,
                      label: 'หมู่บ้าน',
                      value: appState.selectedVillage,
                      items: appState.villages,
                      onChanged: (val) {
                        if (val != null) {
                          appState.setSelectedVillage(val);
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDropdownSelector(
                            context,
                            icon: Icons.calendar_month_outlined,
                            label: 'รอบเดือน (Month)',
                            value: appState.selectedMonthName,
                            items: appState.months,
                            onChanged: (val) {
                              if (val != null) {
                                appState.setSelectedMonthName(val);
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildDropdownSelector(
                            context,
                            icon: Icons.calendar_today_outlined,
                            label: 'ปี พ.ศ. (Year)',
                            value: appState.selectedYear,
                            items: appState.years,
                            onChanged: (val) {
                              if (val != null) {
                                appState.setSelectedYear(val);
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // ตัวกรองสถานะการสำรวจ (Horizontal Chips)
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      child: Row(
                        children: [
                          _buildFilterChip(
                            context,
                            label: 'ทั้งหมด',
                            statusValue: 'all',
                            icon: Icons.grid_view_rounded,
                            activeColor: Colors.blue,
                          ),
                          const SizedBox(width: 8),
                          _buildFilterChip(
                            context,
                            label: 'ยังไม่ได้สำรวจ',
                            statusValue: 'notSurveyed',
                            icon: Icons.hourglass_empty_rounded,
                            activeColor: Colors.amber,
                          ),
                          const SizedBox(width: 8),
                          _buildFilterChip(
                            context,
                            label: 'ค้างชำระ',
                            statusValue: 'surveyedUnpaid',
                            icon: Icons.payment_outlined,
                            activeColor: Colors.redAccent,
                          ),
                          const SizedBox(width: 8),
                          _buildFilterChip(
                            context,
                            label: 'ชำระสำเร็จ',
                            statusValue: 'paid',
                            icon: Icons.check_circle_outline_rounded,
                            activeColor: Colors.green,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // แถบค้นหา
                    TextField(
                      controller: _searchController,
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'ค้นหาด้วย บ้านเลขที่ หรือ ชื่อเจ้าของ...',
                        hintStyle: const TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                        prefixIcon: const Icon(Icons.search, size: 20),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 20),
                                onPressed: () {
                                  setState(() {
                                    _searchController.clear();
                                    _searchQuery = '';
                                  });
                                },
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(vertical: 0),
                        filled: true,
                        fillColor: isDark
                            ? const Color(0xFF2D2D2D)
                            : const Color(0xFFF1F5F9),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // รายการบ้าน
              Expanded(
                child: appState.isLoadingHouseholds
                    ? const Center(
                        child: CircularProgressIndicator(color: Colors.blue),
                      )
                    : filteredList.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.house_outlined,
                                  size: 64,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'ไม่พบข้อมูลครัวเรือนตามเงื่อนไขที่ค้นหา',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => appState.fetchHouseholds(),
                            child: ListView.builder(
                              padding: const EdgeInsets.all(12),
                              itemCount: filteredList.length,
                              itemBuilder: (context, index) {
                                final h = filteredList[index];
                                return _buildHouseholdCard(context, h);
                              },
                            ),
                          ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildHouseholdCard(BuildContext context, Household h) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    Color badgeColor;
    Color textColor;
    String statusText;

    switch (h.status) {
      case HouseholdStatus.notSurveyed:
        badgeColor = isDark
            ? const Color(0xFFFEF3C7).withValues(alpha: 0.15)
            : const Color(0xFFFEF3C7);
        textColor = isDark ? Colors.amber[300]! : const Color(0xFFD97706);
        statusText = 'ยังไม่ได้สำรวจ';
        break;
      case HouseholdStatus.surveyedUnpaid:
        badgeColor = isDark
            ? const Color(0xFFFEE2E2).withValues(alpha: 0.15)
            : const Color(0xFFFEE2E2);
        textColor = isDark ? Colors.red[300]! : const Color(0xFFDC2626);
        statusText = 'ค้างชำระ';
        break;
      case HouseholdStatus.paid:
        badgeColor = isDark
            ? const Color(0xFFDCFCE7).withValues(alpha: 0.15)
            : const Color(0xFFDCFCE7);
        textColor = isDark ? Colors.green[300]! : const Color(0xFF16A34A);
        statusText = 'ชำระเงินสำเร็จ';
        break;
    }

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: theme.dividerColor),
      ),
      color: theme.cardColor,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 10,
        ),
        title: Row(
          children: [
            Text(
              'บ้านเลขที่ ${h.houseNumber}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: badgeColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                statusText,
                style: TextStyle(
                  color: textColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                ),
              ),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'เจ้าของ: ${h.ownerName}',
                style: TextStyle(
                  color: isDark ? Colors.grey[300] : const Color(0xFF334155),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right, color: Colors.grey),
        onTap: () {
          if (h.status == HouseholdStatus.notSurveyed) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => RecordScreen(household: h),
              ),
            );
          } else {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => PaymentScreen(household: h),
              ),
            );
          }
        },
      ),
    );
  }

  Widget _buildDropdownSelector(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.dividerColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.01),
            spreadRadius: 1,
            blurRadius: 4,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(icon, size: 14, color: Colors.grey),
              const SizedBox(width: 4),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              icon: const Icon(
                Icons.keyboard_arrow_down_rounded,
                size: 18,
                color: Colors.grey,
              ),
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF1E293B),
              ),
              dropdownColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              items: items.map((val) {
                return DropdownMenuItem(
                  value: val,
                  child: Text(val, overflow: TextOverflow.ellipsis),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(
    BuildContext context, {
    required String label,
    required String statusValue,
    required IconData icon,
    required Color activeColor,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isSelected = _selectedStatus == statusValue;

    return ChoiceChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 14,
            color: isSelected
                ? Colors.white
                : (isDark
                      ? activeColor.withValues(alpha: 0.8)
                      : activeColor.withValues(alpha: 0.9)),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isSelected
                  ? Colors.white
                  : (isDark ? Colors.grey[300] : const Color(0xFF334155)),
            ),
          ),
        ],
      ),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedStatus = statusValue;
          });
        }
      },
      selectedColor: activeColor,
      backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
      checkmarkColor: Colors.white,
      showCheckmark: false,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isSelected ? activeColor : theme.dividerColor,
          width: 1,
        ),
      ),
      elevation: isSelected ? 2 : 0,
      shadowColor: activeColor.withValues(alpha: 0.3),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
    );
  }
}
