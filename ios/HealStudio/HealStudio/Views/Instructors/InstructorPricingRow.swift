import SwiftUI

struct InstructorPricingRow: View {
    let type: SessionType
    @Binding var price: Int
    @Binding var share: Int
    let isEditing: Bool

    var body: some View {
        HStack {
            Text(type.rawValue.uppercased())
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.healDark)
                .frame(width: 50, alignment: .leading)

            Spacer()

            if isEditing {
                TextField("", value: $price, format: .number)
                    .font(.system(size: 12))
                    .textFieldStyle(.roundedBorder)
                    .frame(width: 70)
                    .keyboardType(.numberPad)

                TextField("", value: $share, format: .number)
                    .font(.system(size: 12))
                    .textFieldStyle(.roundedBorder)
                    .frame(width: 70)
                    .keyboardType(.numberPad)
            } else {
                Text("\(price)")
                    .font(.system(size: 12))
                    .foregroundColor(.healDark)
                    .frame(width: 70, alignment: .trailing)

                Text("\(share)")
                    .font(.system(size: 12))
                    .foregroundColor(.healDark)
                    .frame(width: 70, alignment: .trailing)
            }
        }
        .padding(.vertical, 6)
    }
}
