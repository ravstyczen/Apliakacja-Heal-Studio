import Foundation

enum ClientsAPI {
    static func fetchClients() async throws -> [Client] {
        try await APIClient.shared.request(.get, path: "/api/clients")
    }

    static func createClient(_ data: ClientCreateRequest) async throws -> Client {
        try await APIClient.shared.request(.post, path: "/api/clients", body: data)
    }

    static func updateClient(_ client: Client) async throws {
        try await APIClient.shared.requestVoid(.put, path: "/api/clients", body: client)
    }

    static func deleteClient(id: String) async throws {
        try await APIClient.shared.requestVoid(
            .delete,
            path: "/api/clients",
            queryItems: [URLQueryItem(name: "clientId", value: id)]
        )
    }
}
