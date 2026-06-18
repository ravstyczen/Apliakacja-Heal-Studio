import SwiftUI

struct ClientListView: View {
    @Environment(AuthViewModel.self) private var authVM
    @State private var viewModel = ClientListViewModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        VStack(spacing: 0) {
            headerSection

            if viewModel.isLoading {
                FullScreenLoading()
            } else if viewModel.filteredClients.isEmpty {
                emptyState
            } else {
                clientList
            }
        }
        .background(Color.healBg)
        .overlay(alignment: .bottomTrailing) {
            addButton
        }
        .sheet(isPresented: $viewModel.showForm) {
            ClientFormSheet(
                client: viewModel.editClient,
                isAdmin: authVM.isAdmin,
                onSaved: { viewModel.handleSaved($0) }
            )
        }
        .task {
            await viewModel.fetchClients()
            viewModel.startPolling()
        }
        .onDisappear {
            viewModel.stopPolling()
        }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .active {
                Task { await viewModel.fetchClients(silent: true) }
            }
        }
    }

    private var headerSection: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Klienci")
                    .font(.system(size: 20, weight: .semibold, design: .serif))
                    .foregroundColor(.healDark)

                Spacer()

                Text("\(viewModel.clients.count) klientow")
                    .font(.system(size: 13))
                    .foregroundColor(.gray)
            }

            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                    .font(.system(size: 16))

                TextField("Szukaj klienta...", text: $viewModel.searchText)
                    .font(.system(size: 14))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Color.white)
            .cornerRadius(12)

            HStack(spacing: 8) {
                ForEach(ClientFilter.allCases, id: \.self) { filter in
                    Button {
                        viewModel.filter = filter
                    } label: {
                        Text(filter.rawValue)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(viewModel.filter == filter ? .white : .gray)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(viewModel.filter == filter ? Color.healPrimary : .white)
                            .cornerRadius(16)
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 12)
    }

    private var clientList: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                ForEach(viewModel.filteredClients) { client in
                    Button {
                        viewModel.openEditForm(client)
                    } label: {
                        ClientRowView(client: client, isAdmin: authVM.isAdmin)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .cornerRadius(12)
                    }
                    .contextMenu {
                        Button(role: .destructive) {
                            Task { await viewModel.deleteClient(client) }
                        } label: {
                            Label("Usun", systemImage: "trash")
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 100)
        }
    }

    private var emptyState: some View {
        VStack {
            Spacer()
            Text(viewModel.searchText.isEmpty ? "Brak klientow" : "Nie znaleziono klientow")
                .font(.system(size: 14))
                .foregroundColor(.gray)
            Spacer()
        }
    }

    private var addButton: some View {
        Button {
            viewModel.openCreateForm()
        } label: {
            Image(systemName: "plus")
                .font(.system(size: 22, weight: .semibold))
                .foregroundColor(.white)
                .frame(width: 56, height: 56)
                .background(Color.healPrimary)
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.15), radius: 8, y: 4)
        }
        .padding(.trailing, 16)
        .padding(.bottom, 80)
    }
}
