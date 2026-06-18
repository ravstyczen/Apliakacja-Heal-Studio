import Foundation

enum SessionsAPI {
    static func fetchSessions(timeMin: String, timeMax: String) async throws -> [Session] {
        try await APIClient.shared.request(.get, path: "/api/sessions", queryItems: [
            URLQueryItem(name: "timeMin", value: timeMin),
            URLQueryItem(name: "timeMax", value: timeMax),
        ])
    }

    static func createSession(_ data: SessionCreateRequest) async throws -> SessionCreateResponse {
        try await APIClient.shared.request(.post, path: "/api/sessions", body: data)
    }

    static func updateSession(_ data: SessionUpdateRequest) async throws {
        try await APIClient.shared.requestVoid(.put, path: "/api/sessions", body: data)
    }

    static func deleteSession(
        eventId: String,
        editMode: RecurringEditMode = .single,
        date: String? = nil,
        instructorId: String? = nil,
        sessionType: String? = nil,
        startTime: String? = nil
    ) async throws {
        var queryItems = [
            URLQueryItem(name: "eventId", value: eventId),
            URLQueryItem(name: "editMode", value: editMode.rawValue),
        ]
        if let date { queryItems.append(URLQueryItem(name: "date", value: date)) }
        if let instructorId { queryItems.append(URLQueryItem(name: "instructorId", value: instructorId)) }
        if let sessionType { queryItems.append(URLQueryItem(name: "sessionType", value: sessionType)) }
        if let startTime { queryItems.append(URLQueryItem(name: "startTime", value: startTime)) }

        try await APIClient.shared.requestVoid(.delete, path: "/api/sessions", queryItems: queryItems)
    }
}
