import 'package:flutter/material.dart';

class MainAppBar extends StatelessWidget implements PreferredSizeWidget {
  const MainAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return AppBar(
      backgroundColor: theme.appBarTheme.backgroundColor,
      elevation: isDark ? 0 : 1.5,
      shadowColor: isDark ? Colors.transparent : Colors.black.withValues(alpha: 0.08),
      title: Row(
        children: [
          Container(
            width: 32,
            height: 32,
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
                width: 1.0,
              ),
            ),
            alignment: Alignment.center,
            child: Text(
              'โลโก้',
              style: TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
            ),
            /* // เมื่อต้องการแสดงโลโก้จริง ให้ลบ child ด้านบน และลบ Comment ส่วนนี้ออก
            child: ClipOval(
              child: Image.asset(
                'assets/tunglaung_logo.png',
                width: 32,
                height: 32,
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
                          fontSize: 8,
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
          ),// โลโก้ของแอป
          const SizedBox(width: 6),
          Text(
            'อบต.',
            style: TextStyle(
              color: isDark ? Colors.white : const Color(0xFF1E293B),
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
        ],
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 16.0),
          child: CircleAvatar(
            radius: 18,
            backgroundColor: isDark ? const Color(0xFF2D2D2D) : Colors.grey[300],
            child: Icon(
              Icons.person,
              color: isDark ? Colors.grey[400] : Colors.white,
            ), // รูปโปรไฟล์
          ),
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1.0),
        child: Container(
          color: theme.dividerColor,
          height: 1.0,
         ), // เส้นใต้ Appbar
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
