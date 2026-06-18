import Foundation

enum ClientFilter: String, CaseIterable {
    case all = "Wszyscy"
    case accepted = "Zaakceptowali"
    case pending = "Oczekujacy"
}

@Observable
final class ClientListViewModel {
    var clients: [Client] = []
    var isLoading = false
    var searchText = ""
    var filter: ClientFilter = .all
    var showForm = false
    var editClient: Client?
    var errorMessage: String?

    private var pollingTask: Task<Void, Never>?

    var filteredClients: [Client] {
        clients
            .filter { client in
                let matchesSearch = searchText.isEmpty ||
                    client.fullName.localizedCaseInsensitiveContains(searchText)

                switch filter {
                case .all: return matchesSearch
                case .accepted: return matchesSearch && client.regulationsAccepted
                case .pending: return matchesSearch && !client.regulationsAccepted
                }
            }
            .sorted { a, b in
                let nameA = "\(a.lastName) \(a.firstName)"
                let nameB = "\(b.lastName) \(b.firstName)"
                return nameA.localizedCompare(nameB) == .orderedAscending
            }
    }

    func fetchClients(silent: Bool = false) async {
        if !silent { isLoading = true }
        defer { if !silent { isLoading = false } }

        do {
            let newClients = try await ClientsAPI.fetchClients()
            if newClients != clients {
                clients = newClients
            }
        } catch {
            if !silent {
                errorMessage = error.localizedDescription
            }
        }
    }

    func deleteClient(_ client: Client) async {
        do {
            try await ClientsAPI.deleteClient(id: client.id)
            clients.removeAll { $0.id == client.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func handleSaved(_ client: Client) {
        if let idx = clients.firstIndex(where: { $0.id == client.id }) {
            clients[idx] = client
        } else {
            clients.append(client)
        }
        showForm = false
        editClient = nil
    }

    func openCreateForm() {
        editClient = nil
        showForm = true
    }

    func openEditForm(_ client: Client) {
        editClient = client
        showForm = true
    }

    func startPolling() {
        pollingTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(15))
                guard !Task.isCancelled else { break }
                await self?.fetchClients(silent: true)
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }
}
