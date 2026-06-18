import SwiftUI

struct SettlementView: View {
    @Environment(AuthViewModel.self) private var authVM
    @State private var viewModel = SettlementViewModel()

    var body: some View {
        VStack(spacing: 0) {
            headerSection
            contentSection
        }
        .background(Color.healBg)
        .task {
            await viewModel.loadInstructors()
            await viewModel.syncSettlements()
        }
    }

    private var headerSection: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Rozliczenia")
                    .font(.system(size: 20, weight: .semibold, design: .serif))
                    .foregroundColor(.healDark)

                Spacer()

                Button {
                    Task { await viewModel.syncSettlements() }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .font(.system(size: 12))
                            .rotationEffect(.degrees(viewModel.isSyncing ? 360 : 0))
                            .animation(viewModel.isSyncing ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: viewModel.isSyncing)

                        Text(viewModel.isSyncing ? "Przeliczam..." : "Przelicz")
                            .font(.system(size: 12, weight: .medium))
                    }
                    .foregroundColor(.healPrimary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.healPrimary.opacity(0.1))
                    .cornerRadius(16)
                }
                .disabled(viewModel.isSyncing)
            }

            monthNavigator

            if authVM.isAdmin {
                instructorFilter
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 12)
    }

    private var monthNavigator: some View {
        HStack {
            Button { viewModel.navigateMonth(direction: -1) } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.healDark)
                    .frame(width: 32, height: 32)
            }

            Spacer()

            Text(viewModel.monthDisplayTitle)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.healDark)

            Spacer()

            Button { viewModel.navigateMonth(direction: 1) } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.healDark)
                    .frame(width: 32, height: 32)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.white)
        .cornerRadius(12)
    }

    private var instructorFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                Button {
                    viewModel.selectedInstructorId = nil
                    Task { await viewModel.fetchSettlements() }
                } label: {
                    Text("Wszyscy")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(viewModel.selectedInstructorId == nil ? .white : .gray)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(viewModel.selectedInstructorId == nil ? Color.healPrimary : .white)
                        .cornerRadius(16)
                }

                ForEach(viewModel.allInstructors) { instructor in
                    Button {
                        viewModel.selectedInstructorId = instructor.id
                        Task { await viewModel.fetchSettlements() }
                    } label: {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(Color(hex: instructor.color))
                                .frame(width: 8, height: 8)

                            Text(instructor.firstName)
                                .font(.system(size: 12, weight: .medium))
                        }
                        .foregroundColor(viewModel.selectedInstructorId == instructor.id ? .white : .gray)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(viewModel.selectedInstructorId == instructor.id ? Color.healPrimary : .white)
                        .cornerRadius(16)
                    }
                }
            }
        }
    }

    private var contentSection: some View {
        ScrollView {
            if viewModel.isLoading {
                FullScreenLoading()
            } else if viewModel.monthlyData.isEmpty {
                VStack {
                    Spacer().frame(height: 80)
                    Text("Brak rozliczen w tym miesiacu")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                }
            } else {
                VStack(spacing: 16) {
                    summaryCards

                    ForEach(viewModel.monthlyData) { ms in
                        SettlementInstructorCard(
                            settlement: ms,
                            instructorColor: Color(hex: viewModel.instructorColor(for: ms.instructorId)),
                            isExpanded: viewModel.expandedInstructorId == ms.instructorId,
                            onToggle: { viewModel.toggleExpanded(ms.instructorId) }
                        )
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 100)
            }
        }
    }

    private var summaryCards: some View {
        HStack(spacing: 8) {
            SummaryCard(title: "Godziny", value: "\(viewModel.totalHours)")
            SummaryCard(title: "Przychod", value: "\(viewModel.totalPrice) zl")
            SummaryCard(title: "Udzialy", value: "\(viewModel.totalShare) zl")
        }
    }
}

private struct SummaryCard: View {
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.system(size: 12))
                .foregroundColor(.gray)

            Text(value)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.healDark)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.white)
        .cornerRadius(12)
    }
}
