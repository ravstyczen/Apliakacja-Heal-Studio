import SwiftUI

struct SessionModalView: View {
    let session: Session?
    let date: String?
    let hour: Int?
    let allInstructors: [Instructor]
    let currentInstructor: Instructor?
    let onDismiss: () -> Void

    @State private var viewModel = SessionFormViewModel()
    @State private var showClientPicker = false
    @State private var showRecurringEdit = false
    @State private var showDeleteConfirm = false
    @State private var showRecurringDelete = false
    @Environment(\.dismiss) private var dismiss

    private var isReadOnly: Bool {
        guard let current = currentInstructor else { return true }
        if current.role.isAdminOrOwner { return false }
        if let session, session.instructorId != current.id { return true }
        return false
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    sessionTypeSelector
                    dateTimeSection
                    instructorSelector
                    clientsSection
                    recurringSection
                    openSessionSection

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.system(size: 13))
                            .foregroundColor(.red)
                            .padding(.horizontal)
                    }
                }
                .padding()
            }
            .background(Color.healBg)
            .navigationTitle(viewModel.isEditing ? "Edytuj sesje" : "Nowa sesja")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Anuluj") {
                        onDismiss()
                    }
                }

                if !isReadOnly {
                    ToolbarItem(placement: .confirmationAction) {
                        Button(viewModel.isSaving ? "Zapisywanie..." : "Zapisz") {
                            Task { await handleSave() }
                        }
                        .disabled(viewModel.isSaving || !viewModel.canSave)
                    }
                }

                if viewModel.isEditing && !isReadOnly {
                    ToolbarItem(placement: .destructiveAction) {
                        Button {
                            if viewModel.isRecurring {
                                showRecurringDelete = true
                            } else {
                                showDeleteConfirm = true
                            }
                        } label: {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
        }
        .onAppear {
            viewModel.configure(
                session: session,
                date: date,
                hour: hour,
                allInstructors: allInstructors,
                currentInstructor: currentInstructor
            )
        }
        .sheet(isPresented: $showClientPicker) {
            ClientPickerView(
                maxClients: viewModel.sessionType.maxClients,
                selectedIds: viewModel.clientIds,
                onSelect: { client in
                    viewModel.addClient(id: client.id, name: client.fullName)
                }
            )
        }
        .sheet(isPresented: $showRecurringEdit) {
            RecurringEditSheet(title: "Zapisz zmiany") { mode in
                Task {
                    let success = await viewModel.save(editMode: mode)
                    if success { onDismiss() }
                }
            }
        }
        .sheet(isPresented: $showRecurringDelete) {
            RecurringEditSheet(title: "Usun sesje") { mode in
                Task {
                    let success = await viewModel.delete(editMode: mode)
                    if success { onDismiss() }
                }
            }
        }
        .alert("Usunac sesje?", isPresented: $showDeleteConfirm) {
            Button("Usun", role: .destructive) {
                Task {
                    let success = await viewModel.delete()
                    if success { onDismiss() }
                }
            }
            Button("Anuluj", role: .cancel) {}
        }
        .interactiveDismissDisabled(viewModel.isSaving)
    }

    // MARK: - Session Type Selector

    private var sessionTypeSelector: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Rodzaj sesji")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.gray)

            HStack(spacing: 8) {
                ForEach(SessionType.allCases, id: \.self) { type in
                    Button {
                        guard !isReadOnly else { return }
                        viewModel.sessionType = type
                    } label: {
                        Text(type.rawValue)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(viewModel.sessionType == type ? .white : .healDark)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(viewModel.sessionType == type ? Color.healPrimary : .white)
                            .cornerRadius(10)
                    }
                }
            }
        }
    }

    // MARK: - Date & Time

    private var dateTimeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Data i godzina")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.gray)

            DatePicker("Data", selection: $viewModel.date, displayedComponents: .date)
                .disabled(isReadOnly)

            HStack {
                VStack(alignment: .leading) {
                    Text("Od")
                        .font(.system(size: 11))
                        .foregroundColor(.gray)
                    Picker("", selection: $viewModel.startHour) {
                        ForEach(8...20, id: \.self) { h in
                            Text("\(h):00").tag(h)
                        }
                    }
                    .pickerStyle(.menu)
                    .disabled(isReadOnly)
                }

                Spacer()

                VStack(alignment: .leading) {
                    Text("Do")
                        .font(.system(size: 11))
                        .foregroundColor(.gray)
                    Picker("", selection: $viewModel.endHour) {
                        ForEach((viewModel.startHour + 1)...21, id: \.self) { h in
                            Text("\(h):00").tag(h)
                        }
                    }
                    .pickerStyle(.menu)
                    .disabled(isReadOnly)
                }
            }
            .padding()
            .background(Color.white)
            .cornerRadius(10)
        }
    }

    // MARK: - Instructor Selector

    private var instructorSelector: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Instruktor")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.gray)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(allInstructors) { instructor in
                        Button {
                            guard !isReadOnly else { return }
                            viewModel.selectInstructor(instructor)
                        } label: {
                            VStack(spacing: 4) {
                                Text(instructor.initials)
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(width: 40, height: 40)
                                    .background(Color(hex: instructor.color))
                                    .clipShape(Circle())
                                    .overlay(
                                        Circle()
                                            .stroke(viewModel.instructorId == instructor.id ? Color.healPrimary : .clear, lineWidth: 2)
                                            .padding(-2)
                                    )

                                Text(instructor.firstName)
                                    .font(.system(size: 10))
                                    .foregroundColor(viewModel.instructorId == instructor.id ? .healPrimary : .gray)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Clients Section

    private var clientsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Klienci (\(viewModel.clientNames.count)/\(viewModel.sessionType.maxClients))")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.gray)

                Spacer()

                if !isReadOnly && viewModel.clientNames.count < viewModel.sessionType.maxClients {
                    Button {
                        showClientPicker = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "plus")
                                .font(.system(size: 10))
                            Text("Dodaj")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .foregroundColor(.healPrimary)
                    }
                }
            }

            if viewModel.clientNames.isEmpty {
                Text("Brak przypisanych klientow")
                    .font(.system(size: 13))
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(10)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(viewModel.clientNames.enumerated()), id: \.offset) { idx, name in
                        HStack {
                            Text(name)
                                .font(.system(size: 14))
                                .foregroundColor(.healDark)

                            Spacer()

                            if !isReadOnly {
                                Button {
                                    viewModel.removeClient(at: idx)
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .font(.system(size: 16))
                                        .foregroundColor(.red.opacity(0.6))
                                }
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)

                        if idx < viewModel.clientNames.count - 1 {
                            Divider().padding(.horizontal, 12)
                        }
                    }
                }
                .background(Color.white)
                .cornerRadius(10)
            }
        }
    }

    // MARK: - Recurring

    private var recurringSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Toggle(isOn: Binding(
                get: { viewModel.isRecurring },
                set: { newValue in
                    guard !isReadOnly else { return }
                    viewModel.isRecurring = newValue
                }
            )) {
                Text("Sesja cykliczna")
                    .font(.system(size: 14))
                    .foregroundColor(.healDark)
            }
            .tint(.healPrimary)

            if viewModel.isRecurring {
                DatePicker(
                    "Koniec cyklu",
                    selection: $viewModel.recurringEndDate,
                    displayedComponents: .date
                )
                .font(.system(size: 14))
                .disabled(isReadOnly)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(10)
    }

    // MARK: - Open Session

    private var openSessionSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Toggle(isOn: Binding(
                get: { viewModel.isOpenSession },
                set: { newValue in
                    guard !isReadOnly else { return }
                    viewModel.isOpenSession = newValue
                    if newValue && viewModel.bookingToken == nil {
                        viewModel.generateBookingToken()
                    }
                }
            )) {
                Text("Sesja otwarta")
                    .font(.system(size: 14))
                    .foregroundColor(.healDark)
            }
            .tint(.healPrimary)

            if viewModel.isOpenSession, let url = viewModel.bookingURL {
                HStack {
                    Text(url)
                        .font(.system(size: 11))
                        .foregroundColor(.gray)
                        .lineLimit(1)

                    Button {
                        UIPasteboard.general.string = url
                    } label: {
                        Image(systemName: "doc.on.doc")
                            .font(.system(size: 14))
                            .foregroundColor(.healPrimary)
                    }
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(10)
    }

    // MARK: - Actions

    private func handleSave() async {
        if viewModel.isEditing && viewModel.isRecurring {
            showRecurringEdit = true
        } else {
            let success = await viewModel.save()
            if success { onDismiss() }
        }
    }
}
