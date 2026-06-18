import Foundation
import Observation

@Observable
final class ClientFormViewModel {
    var firstName = ""
    var lastName = ""
    var phone = ""
    var email = ""
    var isOwnerClient = false
    var isSaving = false
    var errorMessage: String?

    private var editingClient: Client?

    var isEditing: Bool { editingClient != nil }

    var canSave: Bool {
        !firstName.trimmingCharacters(in: .whitespaces).isEmpty &&
        !lastName.trimmingCharacters(in: .whitespaces).isEmpty
    }

    func configure(client: Client?) {
        if let client {
            editingClient = client
            firstName = client.firstName
            lastName = client.lastName
            phone = client.phone
            email = client.email
            isOwnerClient = client.isOwnerClient
        }
    }

    func save() async -> Client? {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        do {
            if let existing = editingClient {
                let updated = Client(
                    id: existing.id,
                    firstName: firstName.trimmingCharacters(in: .whitespaces),
                    lastName: lastName.trimmingCharacters(in: .whitespaces),
                    phone: phone.trimmingCharacters(in: .whitespaces),
                    email: email.trimmingCharacters(in: .whitespaces),
                    isOwnerClient: isOwnerClient,
                    regulationsAccepted: existing.regulationsAccepted,
                    regulationsAcceptedDate: existing.regulationsAcceptedDate
                )
                try await ClientsAPI.updateClient(updated)
                return updated
            } else {
                let req = ClientCreateRequest(
                    firstName: firstName.trimmingCharacters(in: .whitespaces),
                    lastName: lastName.trimmingCharacters(in: .whitespaces),
                    phone: phone.trimmingCharacters(in: .whitespaces),
                    email: email.trimmingCharacters(in: .whitespaces),
                    isOwnerClient: isOwnerClient
                )
                return try await ClientsAPI.createClient(req)
            }
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }
}
