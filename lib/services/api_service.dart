// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ApiService {
  static String get baseUrl => AppConfig.backendUrl;

  /// Check if the backend server is available
  static Future<bool> checkConnection() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      print('Connection check failed: $e');
      return false;
    }
  }

  /// Register a new user
  static Future<Map<String, dynamic>?> registerUser({
    required String fullName,
    required String email,
    required int age,
    required String gender,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'fullName': fullName,
          'email': email,
          'age': age,
          'gender': gender,
          'password': password,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        print('Registration failed: ${response.statusCode} - ${response.body}');
        final errorBody = json.decode(response.body);
        return {
          'success': false,
          'message': errorBody['message'] ?? 'Registration failed'
        };
      }
    } catch (e) {
      print('Registration error: $e');
      return {
        'success': false,
        'message': 'Network error occurred'
      };
    }
  }

  /// Login user
  static Future<Map<String, dynamic>?> loginUser({
    required String email,
    required String password,
    required String fullName,
    required String age,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          "fullName": fullName,
          "email": email,
          "password": password,
          "age": age
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        print('Login failed: ${response.statusCode} - ${response.body}');
        try {
          final errorBody = json.decode(response.body);
          return {
            'success': false,
            'message': errorBody['message'] ?? 'Login failed'
          };
        } catch (e) {
          return {
            'success': false,
            'message': 'Login failed with status ${response.statusCode}'
          };
        }
      }
    } catch (e) {
      print('Login error: $e');
      return {
        'success': false,
        'message': 'Network error occurred'
      };
    }
  }
}