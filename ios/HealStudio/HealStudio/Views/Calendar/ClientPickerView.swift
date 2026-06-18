import SwiftUI

struct ClientPickerView: View {
    let maxClients: Int
    let selectedIds: [String]
    let onSelect: (Client) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var clients: [Client] = []
    @State private var searchText = ""
    @State private var isLoading = true

    var filteredClients: [Client] {
        let sorted = clients.sorted {
            "\($0.lastName) \($0.firstName)".localizedCompare("\($1.lastName) \($1.firstName)") == .orderedAscending
        }
        if searchText.isEmpty { return sorted }
        return sorted.filter { $0.fullName.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    FullScreenLoading()
                } else if filteredClients.isEmpty {
                    VStack {
                        Spacer()
                        Text(searchText.isEmpty ? "Brak klientow" : "Nie znaleziono klientow")
                            .font(.system(size: 14))
                            .foregroundColor(.gray)
                        Spacer()
                    }
                } else {
                    List(filteredClients) { client in
                        let isSelected = selectedIds.contains(client.id)
                        let isDisabled = !isSelected && selectedIds.count >= maxClients

                        Button {
                            guard !isSelected, !isDisabled else { return }
                            onSelect(client)
                            dismiss()
                        } label: {
                            HStack {
                                Text(client.initials)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.healPrimary)
                                    .frame(width: 36, height: 36)
                                    .background(Color.healPrimary.opacity(0.1))
                                    .clipShape(Circle())

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(client.fullName)
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(.healDark)

                                    if !client.phone.isEmpty {
                                        Text(client.formattedPhone)
                                            .font(.system(size: 11))
                                            .foregroundColor(.gray)
                                    }
                                }

                                Spacer()

                                if isSelected {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.healPrimary)
                                }
                            }
                        }
                        .disabled(isDisabled)
                        .opacity(isDisabled ? 0.4 : 1)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Wybierz klienta")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Szukaj klienta...")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Anuluj") { dismiss() }
                }
            }
        }
        .task {
            do {
                clients = try await ClientsAPI.fetchClients()
            } catch {
                print("Failed to load clients: \(error)")
            }
            isLoading = false
        }
    }
}
