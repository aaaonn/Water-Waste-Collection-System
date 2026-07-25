class GarbageRate {
  final int id;
  final int subdistrictId;
  final String sizeName;
  final double cost;

  GarbageRate({
    required this.id,
    required this.subdistrictId,
    required this.sizeName,
    required this.cost,
  });

  factory GarbageRate.fromJson(Map<String, dynamic> json) {
    return GarbageRate(
      id: json['id'] as int? ?? 0,
      subdistrictId: json['subdistrict_id'] as int? ?? 0,
      sizeName: json['size_name'] as String? ?? '',
      cost: (json['cost'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
