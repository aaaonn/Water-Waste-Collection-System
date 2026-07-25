class UserProfile {
  final String ownerName;
  final String position;
  final String subdistrictName;
  final String districtName;
  final String provinceName;

  UserProfile({
    required this.ownerName,
    required this.position,
    required this.subdistrictName,
    required this.districtName,
    required this.provinceName,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      ownerName: json['owner_name'] as String? ?? '',
      position: json['position'] as String? ?? '',
      subdistrictName: json['subdistrict_name'] as String? ?? '',
      districtName: json['district_name'] as String? ?? '',
      provinceName: json['province_name'] as String? ?? '',
    );
  }
}
