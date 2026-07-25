import 'package:flutter/material.dart';
import '../../domain/entities/household.dart';
import '../../domain/repositories/household_repository.dart';
import '../../data/repositories/household_repository_impl.dart';
import '../../data/datasources/remote/remote_data_source.dart';
import 'package:my_app/features/auth/data/datasources/secure_storage_service.dart';
import '../../../../core/utils/thai_date_utils.dart';

class HouseholdState extends ChangeNotifier {
  static final HouseholdState _instance = HouseholdState._internal();
  factory HouseholdState() => _instance;

  late final RemoteDataSource _remoteDataSource;
  late HouseholdRepository _repository;

  HouseholdState._internal() {
    _remoteDataSource = RemoteDataSourceImpl(secureStorageService: SecureStorageServiceImpl());
    _repository = HouseholdRepositoryImpl(
      remoteDataSource: _remoteDataSource,
    );
    _initSession();
  }

  /// ใช้สำหรับฉีด Mock Repository ในขั้นตอนการทดสอบ (Unit Testing)
  @visibleForTesting
  void setRepositoryForTesting(HouseholdRepository testRepository) {
    _repository = testRepository;
  }

  final Map<String, int> _villageNameToId = {};
  final Map<String, Household> _detailCache = {};

  Future<void> _initSession() async {
    final secureStorage = SecureStorageServiceImpl();
    final token = await secureStorage.read('jwt_token');
    if (token != null && token.isNotEmpty) {
      await Future.wait([
        fetchVillages(),
        fetchGarbageRates(),
        fetchWaterUnits(),
      ]);
      await fetchHouseholds();
    }
  }

  // --- Sync State (Online-only placeholders) ---
  bool get hasUnsyncedData => false;
  bool get isSyncing => false;

  Future<void> syncPendingData() async {}

  // --- Filter State ---
  String _selectedVillage = 'ทุกหมู่บ้าน';
  String get selectedVillage => _selectedVillage;

  void setSelectedVillage(String village) {
    _selectedVillage = village;
    notifyListeners();
    fetchHouseholds();
  }

  static const List<String> _thaiMonthsList = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];

  String? _selectedMonthName;
  String get selectedMonthName =>
      _selectedMonthName ?? _thaiMonthsList[DateTime.now().month - 1];

  String? _selectedYear;
  String get selectedYear =>
      _selectedYear ?? (DateTime.now().year + 543).toString();

  String get selectedMonth => '$selectedMonthName $selectedYear';

  void setSelectedMonthName(String monthName) {
    _selectedMonthName = monthName;
    notifyListeners();
    fetchHouseholds();
  }

  void setSelectedYear(String year) {
    _selectedYear = year;
    notifyListeners();
    fetchHouseholds();
  }

  void setSelectedMonth(String fullMonth) {
    final parts = fullMonth.split(' ');
    if (parts.length == 2) {
      _selectedMonthName = parts[0];
      _selectedYear = parts[1];
      notifyListeners();
      fetchHouseholds();
    }
  }

  // --- Household Data State ---
  final List<Household> _households = [];
  List<Household> get households => _households;

  // Recent payment activities
  final List<Map<String, dynamic>> _recentActivities = [];
  List<Map<String, dynamic>> get recentActivities => _recentActivities;

  // Villages list
  List<String> _villages = ['ทุกหมู่บ้าน'];
  List<String> get villages => _villages;

  bool _isLoadingVillages = false;
  bool get isLoadingVillages => _isLoadingVillages;

  Future<void> fetchVillages() async {
    if (_isLoadingVillages || _villages.length > 1) return;
    _isLoadingVillages = true;
    notifyListeners();

    try {
      final data = await _repository.getVillages();
      List<String> newVillages = ['ทุกหมู่บ้าน'];
      _villageNameToId.clear();
      for (var item in data) {
        if (item['village_name'] != null) {
          final name = item['village_name'] as String;
          final id = item['id'] as int;
          newVillages.add(name);
          _villageNameToId[name] = id;
        }
      }

      _villages = newVillages;
      if (!_villages.contains(_selectedVillage)) {
        _selectedVillage = 'ทุกหมู่บ้าน';
      }
    } catch (e) {
      debugPrint('fetchVillages error: $e');
    } finally {
      _isLoadingVillages = false;
      notifyListeners();
    }
  }

  List<String> get months => _thaiMonthsList;

  List<String> get years {
    final int currentBE = DateTime.now().year + 543;
    final List<String> list = [];
    for (int year = 2567; year <= currentBE + 1; year++) {
      list.add(year.toString());
    }
    return list;
  }

  (int month, int year) get _selectedMonthYear {
    final m = ThaiDateUtils.kThaiMonthMap[selectedMonthName] ?? DateTime.now().month;
    final y = int.tryParse(selectedYear) != null
        ? int.parse(selectedYear) - 543
        : DateTime.now().year;
    return (m, y);
  }

  void resetVillagesOnLogout() {
    _villages = ['ทุกหมู่บ้าน'];
    _selectedVillage = 'ทุกหมู่บ้าน';
    _households.clear();
    _detailCache.clear();
    notifyListeners();
  }

  bool _isLoadingHouseholds = false;
  bool get isLoadingHouseholds => _isLoadingHouseholds;

  Future<void> fetchHouseholds() async {
    if (_isLoadingHouseholds) return;
    _isLoadingHouseholds = true;
    _detailCache.clear();
    notifyListeners();

    try {
      final (month, year) = _selectedMonthYear;

      int villageId = 0;
      if (_selectedVillage != 'ทุกหมู่บ้าน' && _villageNameToId.containsKey(_selectedVillage)) {
        villageId = _villageNameToId[_selectedVillage]!;
      }

      debugPrint('HouseholdState: fetchHouseholds starting. Selected Village: $_selectedVillage (id: $villageId), Month: $month, Year: $year');
      final list = await _repository.getHouseholds(
        query: '',
        villageName: _selectedVillage,
        villageId: villageId,
        month: month,
        year: year,
      );

      debugPrint('HouseholdState: fetchHouseholds completed. Received ${list.length} households.');
      _households.clear();
      _households.addAll(list);
    } catch (e, stack) {
      debugPrint('HouseholdState fetchHouseholds error: $e');
      debugPrint('HouseholdState fetchHouseholds stacktrace: $stack');
    } finally {
      _isLoadingHouseholds = false;
      notifyListeners();
    }
  }

  Future<Household?> fetchHouseholdDetail(String id, {HouseholdStatus? status}) async {
    final cacheKey = '$id-$selectedMonthName-$selectedYear';
    if (_detailCache.containsKey(cacheKey)) {
      return _detailCache[cacheKey];
    }
    try {
      final (month, year) = _selectedMonthYear;

      HouseholdStatus resolvedStatus = status ?? HouseholdStatus.notSurveyed;
      if (status == null) {
        final index = _households.indexWhere((h) => h.id == id);
        if (index != -1) {
          resolvedStatus = _households[index].status;
        }
      }

      final detail = await _remoteDataSource.fetchHouseholdDetail(id, resolvedStatus, month, year);
      if (detail != null) {
        _detailCache[cacheKey] = detail;
        return detail;
      }
    } catch (e) {
      debugPrint('fetchHouseholdDetail error: $e');
    }
    return null;
  }

  List<GarbageRate> _garbageRates = [];
  List<GarbageRate> get garbageRates => _garbageRates;

  Future<List<GarbageRate>> fetchGarbageRates() async {
    try {
      final data = await _repository.getGarbageRates();
      _garbageRates = data.map((item) => GarbageRate.fromJson(item)).toList();
      notifyListeners();
      return _garbageRates;
    } catch (e) {
      debugPrint('fetchGarbageRates error: $e');
    }
    return [];
  }

  List<dynamic> _waterUnits = [];
  List<dynamic> get waterUnits => _waterUnits;

  Future<List<dynamic>> fetchWaterUnits() async {
    try {
      final data = await _repository.getWaterUnits();
      _waterUnits = data;
      notifyListeners();
      return _waterUnits;
    } catch (e) {
      debugPrint('fetchWaterUnits error: $e');
    }
    return [];
  }

  Future<String?> submitSurvey({
    required String id,
    required double currentMeter,
    required Map<int, int> binCountsByID,
  }) async {
    final cacheKey = '$id-$selectedMonthName-$selectedYear';
    _detailCache.remove(cacheKey);
    try {
      final (month, year) = _selectedMonthYear;

      // Map size ID to size name to pass to calculateCharges
      final Map<String, int> garbageBins = {};
      for (final entry in binCountsByID.entries) {
        final rateId = entry.key;
        final count = entry.value;
        try {
          final rate = _garbageRates.firstWhere((r) => r.id == rateId);
          garbageBins[ThaiDateUtils.mapSizeKey(rate.sizeName)] = count;
        } catch (_) {
          // If rateId is not found, we might skip or handle it, but fallback is fine
        }
      }

      final invoiceId = await _repository.saveSurvey(
        id: id,
        currentMeter: currentMeter,
        binCountsByID: binCountsByID,
        garbageBins: garbageBins,
        month: month,
        year: year,
      );

      // Update local state status to surveyedUnpaid
      final index = _households.indexWhere((h) => h.id == id);
      if (index != -1) {
        _households[index].status = HouseholdStatus.surveyedUnpaid;
        _households[index].invoiceId = invoiceId;
        final updatedDetail = await fetchHouseholdDetail(id, status: HouseholdStatus.surveyedUnpaid);
        if (updatedDetail != null) {
          _households[index] = updatedDetail;
        }
      }
      notifyListeners();
      return null;
    } catch (e, stack) {
      debugPrint('submitSurvey error: $e');
      debugPrint('submitSurvey stack: $stack');
      return e.toString();
    }
  }



  Future<bool> payBill(String id, String method) async {
    final cacheKey = '$id-$selectedMonthName-$selectedYear';
    _detailCache.remove(cacheKey);
    int index = _households.indexWhere((h) => h.id == id);
    String? invoiceId;
    if (index != -1) {
      invoiceId = _households[index].invoiceId;
    }

    try {
      await _repository.payBill(
        id: id,
        paymentMethod: method,
        invoiceId: invoiceId,
      );

      if (index != -1) {
        _households[index].status = HouseholdStatus.paid;
        _households[index].paymentMethod = method;
        _households[index].paymentTime = DateTime.now();

        _recentActivities.insert(0, {
          'id': _households[index].houseNumber,
          'ownerName': _households[index].ownerName,
          'time': 'เมื่อสักครู่',
          'amount': _households[index].totalAmount,
        });

        if (_recentActivities.length > 5) {
          _recentActivities.removeLast();
        }

        notifyListeners();
      }
      return true;
    } catch (e) {
      debugPrint('payBill error: $e');
      return false;
    }
  }

  Future<String?> generatePromptPayQR(String invoiceId) async {
    return await _remoteDataSource.generatePromptPayQR(invoiceId);
  }

  Future<bool> payBillCash(String invoiceId) async {
    return await _remoteDataSource.payBillCash(invoiceId);
  }

  Future<String?> checkPaymentStatus(String invoiceId) async {
    return await _remoteDataSource.checkPaymentStatus(invoiceId);
  }

  List<Household> getFilteredHouseholds(String query) {
    return _households.where((h) {
      final matchesVillage =
          _selectedVillage == 'ทุกหมู่บ้าน' || h.village == _selectedVillage;
      final matchesQuery = h.houseNumber.contains(query) || h.ownerName.contains(query);
      return matchesVillage && matchesQuery;
    }).toList();
  }

  int get totalCount {
    if (_selectedVillage == 'ทุกหมู่บ้าน') {
      return _households.length;
    }
    return _households.where((h) => h.village == _selectedVillage).length;
  }

  int get completedCount {
    if (_selectedVillage == 'ทุกหมู่บ้าน') {
      return _households.where((h) => h.status == HouseholdStatus.paid).length;
    }
    return _households
        .where(
          (h) =>
              h.village == _selectedVillage && h.status == HouseholdStatus.paid,
        )
        .length;
  }

  int get remainingCount => totalCount - completedCount;

  int get notSurveyedCount {
    if (_selectedVillage == 'ทุกหมู่บ้าน') {
      return _households.where((h) => h.status == HouseholdStatus.notSurveyed).length;
    }
    return _households
        .where(
          (h) => h.village == _selectedVillage && h.status == HouseholdStatus.notSurveyed,
        )
        .length;
  }

  int get unpaidCount {
    if (_selectedVillage == 'ทุกหมู่บ้าน') {
      return _households.where((h) => h.status == HouseholdStatus.surveyedUnpaid).length;
    }
    return _households
        .where(
          (h) => h.village == _selectedVillage && h.status == HouseholdStatus.surveyedUnpaid,
        )
        .length;
  }

  Future<void> triggerSync() async {
    await fetchHouseholds();
  }

  bool get hasUnsyncedChanges => false;
}

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
