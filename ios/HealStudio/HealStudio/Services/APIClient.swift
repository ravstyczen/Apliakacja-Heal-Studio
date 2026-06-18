import Foundation

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

enum APIError: LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int, data: Data)
    case noAuthToken
    case decodingError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Nieprawidlowa odpowiedz serwera"
        case .httpError(let code, _):
            return "Blad HTTP: \(code)"
        case .noAuthToken:
            return "Brak tokenu autoryzacji"
        case .decodingError(let error):
            return "Blad dekodowania: \(error.localizedDescription)"
        }
    }
}

actor APIClient {
    static let shared = APIClient()

    #if DEBUG
    private let baseURL = URL(string: "http://localhost:3000")!
    #else
    private let baseURL = URL(string: "https://your-production-url.com")!
    #endif

    private let session = URLSession.shared
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        return d
    }()
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        return e
    }()

    func request<T: Decodable>(
        _ method: HTTPMethod,
        path: String,
        queryItems: [URLQueryItem]? = nil,
        body: (any Encodable)? = nil
    ) async throws -> T {
        var components = URLComponents(
            url: baseURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        )!
        components.queryItems = queryItems

        var request = URLRequest(url: components.url!)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.cachePolicy = .reloadIgnoringLocalCacheData

        let token = try await AuthService.shared.getIDToken()
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        if let body {
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: httpResponse.statusCode, data: data)
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    func requestVoid(
        _ method: HTTPMethod,
        path: String,
        queryItems: [URLQueryItem]? = nil,
        body: (any Encodable)? = nil
    ) async throws {
        let _: SuccessResponse = try await request(method, path: path, queryItems: queryItems, body: body)
    }
}
