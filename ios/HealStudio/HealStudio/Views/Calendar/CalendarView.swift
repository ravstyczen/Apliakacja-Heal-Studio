import SwiftUI

struct CalendarView: View {
    @Environment(AuthViewModel.self) private var authVM
    @State private var viewModel = CalendarViewModel()
    @Environment(\.scenePhase) private var scenePhase

    private let hours = Array(8...20)

    var body: some View {
        VStack(spacing: 0) {
            calendarHeader

            if !viewModel.allInstructors.isEmpty {
                instructorLegend
            }

            if viewModel.isLoading {
                FullScreenLoading()
            } else {
                calendarGrid
            }
        }
        .background(Color.healBg)
        .sheet(isPresented: $viewModel.showSessionModal) {
            SessionModalView(
                session: viewModel.selectedSession,
                date: viewModel.selectedDate,
                hour: viewModel.selectedHour,
                allInstructors: viewModel.allInstructors,
                currentInstructor: authVM.currentInstructor,
                onDismiss: {
                    viewModel.showSessionModal = false
                    Task { await viewModel.fetchSessions() }
                }
            )
        }
        .task {
            await viewModel.loadInstructors()
            await viewModel.fetchSessions()
            viewModel.startPolling()
        }
        .onDisappear {
            viewModel.stopPolling()
        }
        .onChange(of: scenePhase) { _, newPhase in
            viewModel.handleScenePhaseChange(newPhase)
        }
        .gesture(
            DragGesture(minimumDistance: 60)
                .onEnded { value in
                    if abs(value.translation.width) > abs(value.translation.height) * 1.5 {
                        viewModel.navigateWeek(direction: value.translation.width < 0 ? 1 : -1)
                    }
                }
        )
    }

    private var calendarHeader: some View {
        HStack {
            Button { viewModel.navigateWeek(direction: -1) } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.healDark)
                    .frame(width: 36, height: 36)
            }

            Spacer()

            Text(viewModel.monthYearTitle)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.healDark)

            Spacer()

            Button { viewModel.goToToday() } label: {
                Text("Dzis")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.healPrimary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.healPrimary.opacity(0.1))
                    .cornerRadius(16)
            }

            Button { viewModel.navigateWeek(direction: 1) } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.healDark)
                    .frame(width: 36, height: 36)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private var instructorLegend: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(viewModel.allInstructors) { instructor in
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color(hex: instructor.color))
                            .frame(width: 8, height: 8)

                        Text(instructor.firstName)
                            .font(.system(size: 11))
                            .foregroundColor(.gray)
                    }
                }
            }
            .padding(.horizontal, 16)
        }
        .padding(.bottom, 4)
    }

    private var calendarGrid: some View {
        ScrollView(.vertical, showsIndicators: false) {
            LazyVStack(spacing: 0, pinnedViews: [.sectionHeaders]) {
                Section(header: WeekHeaderView(days: viewModel.weekDays)) {
                    ForEach(hours, id: \.self) { hour in
                        HStack(spacing: 0) {
                            Text("\(hour):00")
                                .font(.system(size: 10))
                                .foregroundColor(.gray)
                                .frame(width: 40, alignment: .trailing)
                                .padding(.trailing, 4)

                            ForEach(viewModel.weekDays, id: \.self) { day in
                                let daySessions = viewModel.sessionsForSlot(date: day, hour: hour)

                                ZStack {
                                    Rectangle()
                                        .fill(Color.clear)
                                        .contentShape(Rectangle())
                                        .onTapGesture {
                                            viewModel.openCreateSession(date: day, hour: hour)
                                        }

                                    if !daySessions.isEmpty {
                                        VStack(spacing: 1) {
                                            ForEach(daySessions) { session in
                                                SessionCardView(
                                                    session: session,
                                                    color: Color(hex: viewModel.instructorColor(for: session.instructorId))
                                                )
                                                .onTapGesture {
                                                    viewModel.openEditSession(session)
                                                }
                                            }
                                        }
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 56)
                                .overlay(
                                    Rectangle()
                                        .stroke(Color.healLight.opacity(0.5), lineWidth: 0.5)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
