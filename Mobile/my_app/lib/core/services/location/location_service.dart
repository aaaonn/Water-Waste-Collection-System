import 'dart:async';

class UserLocation {
  final double latitude;
  final double longitude;
  final double? accuracy;

  UserLocation({required this.latitude, required this.longitude, this.accuracy});
}

abstract class LocationService {
  Future<bool> hasPermission();
  Future<bool> requestPermission();
  Future<UserLocation?> getCurrentLocation();
}

class LocationServiceImpl implements LocationService {
  @override
  Future<bool> hasPermission() async {
    // ในอนาคตจะเชื่อมต่อแพ็กเกจ geolocator หรือ permission_handler
    return true;
  }

  @override
  Future<bool> requestPermission() async {
    return true;
  }

  @override
  Future<UserLocation?> getCurrentLocation() async {
    final granted = await hasPermission();
    if (!granted) return null;

    // จำลองการขอพิกัด GPS 500ms (พิกัด ต.ทุ่งหลวง จ.สุรินทร์ หรือพื้นที่สำรวจ)
    await Future.delayed(const Duration(milliseconds: 500));
    return UserLocation(
      latitude: 14.8824,
      longitude: 103.4938,
      accuracy: 15.0,
    );
  }
}
