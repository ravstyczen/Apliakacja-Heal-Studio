import SwiftUI

struct ClientFormSheet: View {
    let client: Client?
    let isAdmin: Bool
    let onSaved: (Client) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = ClientFormViewModel()

    var body: some View {
        NavigationStack {
            Form {
                Section("Dane osobowe") {
                    TextField("Imie", text: $viewModel.firstName)
                        .textContentType(.givenName)

                    TextField("Nazwisko", text: $viewModel.lastName)
                        .textContentType(.familyName)
                }

                Section("Kontakt") {
                    TextField("Telefon", text: $viewModel.phone)
                        .textContentType(.telephoneNumber)
                        .keyboardType(.phonePad)

                    TextField("E-mail", text: $viewModel.email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }

                if isAdmin {
                    Section {
                        Toggle("Klient wlasciciela", isOn: $viewModel.isOwnerClient)
                            .tint(.healPrimary)
                    }
                }

                if viewModel.isEditing, let c = client {
                    Section("Regulamin") {
                        HStack {
                            Text("Status")
                            Spacer()
                            if c.regulationsAccepted {
                                Label("Zaakceptowany", systemImage: "checkmark.circle.fill")
                                    .font(.system(size: 13))
                                    .foregroundColor(.green)
                            } else {
                                Label("Oczekujacy", systemImage: "exclamationmark.circle.fill")
                                    .font(.system(size: 13))
                                    .foregroundColor(.orange)
                            }
                        }

                        if let date = c.regulationsAcceptedDate {
                            HStack {
                                Text("Data akceptacji")
                                Spacer()
                                Text(date)
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                }

                if let error = viewModel.errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.system(size: 13))
                    }
                }
            }
            .navigationTitle(viewModel.isEditing ? "Edytuj klienta" : "Nowy klient")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Anuluj") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(viewModel.isSaving ? "Zapisywanie..." : "Zapisz") {
                        Task {
                            if let saved = await viewModel.save() {
                                onSaved(saved)
                                dismiss()
                            }
                        }
                    }
                    .disabled(!viewModel.canSave || viewModel.isSaving)
                }
            }
        }
        .onAppear {
            viewModel.configure(client: client)
        }
    }
}
