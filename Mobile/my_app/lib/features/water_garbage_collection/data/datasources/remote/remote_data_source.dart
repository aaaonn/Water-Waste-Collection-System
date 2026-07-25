import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../../models/household_model.dart';
import '../../../domain/entities/household.dart';
import '../../../../../core/config/api_config.dart';
import '../../../../../features/auth/data/datasources/secure_storage_service.dart';

abstract class RemoteDataSource {
  Future<List<HouseholdModel>> fetchHouseholds({
    required int villageId,
    required int month,
    required int year,
  });
  Future<HouseholdModel?> fetchHouseholdDetail(String id, HouseholdStatus status, int month, int year);
  Future<List<Map<String, dynamic>>> fetchVillages();
  Future<List<Map<String, dynamic>>> fetchGarbageRates();
  Future<List<Map<String, dynamic>>> fetchWaterUnits();
  Future<bool> submitSurvey({
    required String id,
    required double currentMeter,
    required Map<int, int> binCountsByID,
    required int month,
    required int year,
  });
  Future<String?> generatePromptPayQR(String invoiceId);
  Future<bool> payBillCash(String invoiceId);
  Future<String?> checkPaymentStatus(String invoiceId);
}

class RemoteDataSourceImpl implements RemoteDataSource {
  final SecureStorageService secureStorageService;
  final HttpClient _client;

  RemoteDataSourceImpl({
    required this.secureStorageService,
    HttpClient? client,
  }) : _client = client ?? (HttpClient()..connectionTimeout = const Duration(seconds: 10));

  Future<String?> _getToken() async {
    return await secureStorageService.read('jwt_token');
  }

  @override
  Future<List<HouseholdModel>> fetchHouseholds({
    required int villageId,
    required int month,
    required int year,
  }) async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) {
        debugPrint('RemoteDataSource: No token found');
        return [];
      }

      final client = _client;

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.households}');
      final body = {
        'village_id': villageId > 0 ? villageId : null,
        'month': month.toString(),
        'year': year.toString(),
        'status': 'all',
        'query': '',
      };
      
      debugPrint('RemoteDataSource: Fetching households from $uri');
      debugPrint('RemoteDataSource: Request body: ${json.encode(body)}');

      final request = await client.postUrl(uri);
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      request.write(json.encode(body));

      final response = await request.close();
      debugPrint('RemoteDataSource: Response status code: ${response.statusCode}');
      
      if (response.statusCode == HttpStatus.ok) {
        final responseBody = await response.transform(utf8.decoder).join();
        debugPrint('RemoteDataSource: Response body length: ${responseBody.length}');
        final List<dynamic> data = json.decode(responseBody);
        
        final thaiMonths = [
          'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        final monthName = thaiMonths[month - 1];
        final yearBE = year + 543;
        final billMonthStr = '$monthName $yearBE';

        final list = data.map((item) {
          final model = HouseholdModel.fromJson(Map<String, dynamic>.from(item as Map));
          model.billMonth = billMonthStr;
          return model;
        }).toList();
        
        debugPrint('RemoteDataSource: Successfully parsed ${list.length} households.');
        return list;
      } else {
        debugPrint('RemoteDataSource fetchHouseholds error status: ${response.statusCode}');
        try {
          final errBody = await response.transform(utf8.decoder).join();
          debugPrint('RemoteDataSource fetchHouseholds error body: $errBody');
        } catch (_) {}
      }
    } catch (e, stack) {
      debugPrint('RemoteDataSource fetchHouseholds error: $e');
      debugPrint('RemoteDataSource fetchHouseholds stacktrace: $stack');
    }
    return [];
  }

  @override
  Future<HouseholdModel?> fetchHouseholdDetail(String id, HouseholdStatus status, int month, int year) async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) return null;

      String endpointPath = '${ApiConfig.households}/$id';
      if (status == HouseholdStatus.paid) {
        endpointPath = '/mobile/receipts/$id';
      } else if (status == HouseholdStatus.surveyedUnpaid) {
        endpointPath = '/mobile/invoices/$id';
      }

      final client = _client;

      final uri = Uri.parse('${ApiConfig.baseUrl}$endpointPath').replace(
        queryParameters: {
          'month': month.toString(),
          'year': year.toString(),
        },
      );

      final request = await client.getUrl(uri);
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');

      final response = await request.close();
      if (response.statusCode == HttpStatus.ok) {
        final responseBody = await response.transform(utf8.decoder).join();
        final Map<String, dynamic> data = json.decode(responseBody);
        return HouseholdModel.fromJson(data);
      } else {
        debugPrint('RemoteDataSource fetchHouseholdDetail error status: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('RemoteDataSource fetchHouseholdDetail error: $e');
    }
    return null;
  }

  @override
  Future<List<Map<String, dynamic>>> fetchVillages() async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) return [];

      final client = _client;

      final url = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.villages}');
      final request = await client.getUrl(url);
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');

      final response = await request.close();
      if (response.statusCode == HttpStatus.ok) {
        final responseBody = await response.transform(utf8.decoder).join();
        final List<dynamic> data = json.decode(responseBody);
        return List<Map<String, dynamic>>.from(data);
      }
    } catch (e) {
      debugPrint('RemoteDataSource fetchVillages error: $e');
    }
    return [];
  }

  @override
  Future<List<Map<String, dynamic>>> fetchGarbageRates() async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) return [];

      final client = _client;

      final uri = Uri.parse('${ApiConfig.baseUrl}/mobile/garbage-rates');
      final request = await client.getUrl(uri);
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');

      final response = await request.close();
      if (response.statusCode == HttpStatus.ok) {
        final responseBody = await response.transform(utf8.decoder).join();
        final List<dynamic> data = json.decode(responseBody);
        return List<Map<String, dynamic>>.from(data);
      }
    } catch (e) {
      debugPrint('RemoteDataSource fetchGarbageRates error: $e');
    }
    return [];
  }

  @override
  Future<List<Map<String, dynamic>>> fetchWaterUnits() async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) return [];

      final client = _client;

      final uri = Uri.parse('${ApiConfig.baseUrl}/mobile/water-units');
      final request = await client.getUrl(uri);
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');

      final response = await request.close();
      if (response.statusCode == HttpStatus.ok) {
        final responseBody = await response.transform(utf8.decoder).join();
        final List<dynamic> data = json.decode(responseBody);
        return List<Map<String, dynamic>>.from(data);
      }
    } catch (e) {
      debugPrint('RemoteDataSource fetchWaterUnits error: $e');
    }
    return [];
  }

  @override
  Future<bool> submitSurvey({
    required String id,
    required double currentMeter,
    required Map<int, int> binCountsByID,
    required int month,
    required int year,
  }) async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) return false;

      final householdId = int.tryParse(id) ?? 0;
      final client = _client;

      // 1. Submit Water Reading
      final waterUri = Uri.parse('${ApiConfig.baseUrl}/mobile/water-readings');
      final waterReq = await client.postUrl(waterUri);
      waterReq.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      waterReq.headers.set(HttpHeaders.contentTypeHeader, 'application/json');

      final waterBody = {
        'household_id': householdId,
        'curr_reading': currentMeter,
        'month': month,
        'year': year,
      };
      waterReq.write(json.encode(waterBody));
      final waterResponse = await waterReq.close();
      if (waterResponse.statusCode != HttpStatus.created && waterResponse.statusCode != HttpStatus.ok) {
        final errorBody = await waterResponse.transform(utf8.decoder).join();
        debugPrint('RemoteDataSource submitSurvey water error: $errorBody');
        return false;
      }

      // 2. Submit Garbage Reading (always send, even if details is empty,
      //    so the backend can clear old records and set TotalAmount = 0)
      final List<Map<String, dynamic>> details = [];
      binCountsByID.forEach((rateId, count) {
        if (count > 0) {
          details.add({
            'garbage_size_id': rateId,
            'amount': count,
          });
        }
      });

      final garbageUri = Uri.parse('${ApiConfig.baseUrl}/mobile/garbage-readings');
      final garbageReq = await client.postUrl(garbageUri);
      garbageReq.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      garbageReq.headers.set(HttpHeaders.contentTypeHeader, 'application/json');

      final garbageBody = {
        'household_id': householdId,
        'details': details,
        'month': month,
        'year': year,
      };
      garbageReq.write(json.encode(garbageBody));
      final garbageResponse = await garbageReq.close();
      if (garbageResponse.statusCode != HttpStatus.created && garbageResponse.statusCode != HttpStatus.ok) {
        final errorBody = await garbageResponse.transform(utf8.decoder).join();
        debugPrint('RemoteDataSource submitSurvey garbage error: $errorBody');
        return false;
      }

      return true;
    } catch (e) {
      debugPrint('RemoteDataSource submitSurvey error: $e');
    }
    return false;
  }

  @override
  Future<String?> generatePromptPayQR(String invoiceId) async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) return null;

      final client = _client;

      final uri = Uri.parse('${ApiConfig.baseUrl}/payments/promptpay');
      final request = await client.postUrl(uri);
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');

      final body = {
        'invoice_id': int.tryParse(invoiceId) ?? 0,
      };
      request.write(json.encode(body));

      final response = await request.close();
      if (response.statusCode == HttpStatus.created || response.statusCode == HttpStatus.ok) {
        final responseBody = await response.transform(utf8.decoder).join();
        final Map<String, dynamic> data = json.decode(responseBody);
        return (data['external_ref'] ?? data['qr_code_url']) as String?;
      }
    } catch (e) {
      debugPrint('RemoteDataSource generatePromptPayQR error: $e');
    }
    return null;
  }

  @override
  Future<bool> payBillCash(String invoiceId) async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) return false;

      final client = _client;

      final uri = Uri.parse('${ApiConfig.baseUrl}/payments/cash');
      final request = await client.postUrl(uri);
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');

      final body = {
        'invoice_id': int.tryParse(invoiceId) ?? 0,
      };
      request.write(json.encode(body));

      final response = await request.close();
      return (response.statusCode == HttpStatus.created || response.statusCode == HttpStatus.ok);
    } catch (e) {
      debugPrint('RemoteDataSource payBillCash error: $e');
    }
    return false;
  }

  @override
  Future<String?> checkPaymentStatus(String invoiceId) async {
    try {
      final token = await _getToken();
      if (token == null || token.isEmpty) return null;

      final client = _client;

      final uri = Uri.parse('${ApiConfig.baseUrl}/payments/status/$invoiceId');
      final request = await client.getUrl(uri);
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');

      final response = await request.close();
      if (response.statusCode == HttpStatus.ok) {
        final responseBody = await response.transform(utf8.decoder).join();
        final Map<String, dynamic> data = json.decode(responseBody);
        return data['status'] as String?;
      }
    } catch (e) {
      debugPrint('RemoteDataSource checkPaymentStatus error: $e');
    }
    return null;
  }
}
