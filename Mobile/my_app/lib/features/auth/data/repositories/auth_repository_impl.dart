import 'dart:convert';
import 'dart:io';
import '../../domain/entities/user_profile.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/secure_storage_service.dart';
import '../../../../core/config/api_config.dart';
import 'package:flutter/foundation.dart';

class AuthRepositoryImpl implements AuthRepository {
  final SecureStorageService secureStorageService;
  final HttpClient _httpClient;

  AuthRepositoryImpl({
    required this.secureStorageService,
    HttpClient? httpClient,
  }) : _httpClient = httpClient ?? HttpClient() {
    // กำหนด Timeout สำหรับการเชื่อมต่อ API
    _httpClient.connectionTimeout = const Duration(seconds: 10);
  }

  @override
  Future<bool> login(String username, String password) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.login}');
      final request = await _httpClient.postUrl(url);
      
      // ตั้งค่า Header
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      
      // ส่งข้อมูล username & password เป็น JSON
      final body = json.encode({
        'username': username,
        'password': password,
      });
      request.write(body);
      
      final response = await request.close();
      
      if (response.statusCode == HttpStatus.ok) {
        final responseBody = await response.transform(utf8.decoder).join();
        final Map<String, dynamic> data = json.decode(responseBody);
        final String? token = data['token'];
        
        if (token != null) {
          // บันทึก JWT Token ลง Secure Storage
          await secureStorageService.write('jwt_token', token);
          await secureStorageService.write('username', username);
          return true;
        }
      }
      return false;
    } catch (e, stack) {
      // จัดการกับ Network Error / Connection Refused
      debugPrint("Login error: $e");
      debugPrint("Login stacktrace: $stack");
      return false;
    }
  }

  @override
  Future<void> logout() async {
    await secureStorageService.delete('jwt_token');
    await secureStorageService.delete('username');
  }

  @override
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<String?> getToken() async {
    return await secureStorageService.read('jwt_token');
  }

  @override
  Future<UserProfile?> getProfile() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        debugPrint('getProfile: No token found');
        return null;
      }

      final url = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.profile}');
      final request = await _httpClient.getUrl(url);
      
      // ตั้งค่า Header แนบ JWT Token
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');

      final response = await request.close();
      if (response.statusCode == HttpStatus.ok) {
        final responseBody = await response.transform(utf8.decoder).join();
        final Map<String, dynamic> data = json.decode(responseBody);
        return UserProfile.fromJson(data);
      } else {
        debugPrint('getProfile: HTTP error status code: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('getProfile: Exception during API call: $e');
    }
    return null;
  }
}
