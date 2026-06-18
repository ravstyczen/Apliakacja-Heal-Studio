import SwiftUI

struct InstructorSettingsView: View {
    @Environment(AuthViewModel.self) private var authVM
    @State private var viewModel = InstructorSettingsViewModel()

    var body: some View {
        VStack(spacing: 0) {
            headerSection
            contentSection
        }
        .background(Color.healBg)
        .task {
            await viewModel.fetchInstructors()
        }
    }

    private var headerSection: some View {
        VStack(spacing: 8) {
            HStack {
                Text("Instruktorzy")
                    .font(.system(size: 20, weight: .semibold, design: .serif))
                    .foregroundColor(.healDark)

                Spacer()

                if viewModel.editingId != nil {
                    Button {
                        Task { await viewModel.save() }
                    } label: {
                        Text(viewModel.isSaving ? "Zapisywanie..." : "Zapisz")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.healPrimary)
                            .cornerRadius(8)
                    }
                    .disabled(viewModel.isSaving)
                }
            }

            if let message = viewModel.message {
                Text(message)
                    .font(.system(size: 13))
                    .foregroundColor(viewModel.isError ? .red : .green)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity)
                    .background(viewModel.isError ? Color.red.opacity(0.1) : Color.green.opacity(0.1))
                    .cornerRadius(8)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 12)
    }

    private var contentSection: some View {
        ScrollView {
            if viewModel.isLoading {
                FullScreenLoading()
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.instructors) { instructor in
                        instructorCard(instructor)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 100)
            }
        }
    }

    private func instructorCard(_ instructor: Instructor) -> some View {
        let isEditing = viewModel.editingId == instructor.id
        let index = viewModel.instructors.firstIndex(where: { $0.id == instructor.id })!

        return VStack(spacing: 0) {
            HStack(spacing: 12) {
                Text(instructor.initials)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 48, height: 48)
                    .background(Color(hex: instructor.color))
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text(instructor.name)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.healDark)

                    Text(instructor.email)
                        .font(.system(size: 11))
                        .foregroundColor(.gray)

                    HStack(spacing: 6) {
                        Text(instructor.role.displayName)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(roleColor(instructor.role))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(roleColor(instructor.role).opacity(0.1))
                            .cornerRadius(8)

                        Text("Kolor: \(instructor.colorName)")
                            .font(.system(size: 10))
                            .foregroundColor(.gray)
                    }
                }

                Spacer()

                Button {
                    viewModel.toggleEditing(instructor.id)
                } label: {
                    Text(isEditing ? "Zwin" : "Edytuj")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.healPrimary)
                }
            }
            .padding(16)

            Divider()

            VStack(spacing: 0) {
                HStack {
                    Text("Rodzaj")
                        .frame(width: 50, alignment: .leading)
                    Spacer()
                    Text("Cena (zl)")
                        .frame(width: 70, alignment: .trailing)
                    Text("Udzial (zl)")
                        .frame(width: 70, alignment: .trailing)
                }
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.gray)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.healBg)

                ForEach(SessionType.allCases, id: \.self) { type in
                    InstructorPricingRow(
                        type: type,
                        price: Binding(
                            get: { viewModel.instructors[index].pricing.price(for: type) },
                            set: { viewModel.updatePricing(instructorId: instructor.id, type: type, field: .price, value: $0) }
                        ),
                        share: Binding(
                            get: { viewModel.instructors[index].pricing.share(for: type) },
                            set: { viewModel.updatePricing(instructorId: instructor.id, type: type, field: .share, value: $0) }
                        ),
                        isEditing: isEditing
                    )
                    .padding(.horizontal, 16)

                    if type != .trio {
                        Divider().padding(.horizontal, 16)
                    }
                }
            }
        }
        .background(Color.white)
        .cornerRadius(12)
    }

    private func roleColor(_ role: InstructorRole) -> Color {
        switch role {
        case .owner: return .orange
        case .admin: return .purple
        case .instructor: return .blue
        }
    }
}
