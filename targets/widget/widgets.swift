import WidgetKit
import SwiftUI

// Define the data structure matching lib/widget.ts
struct WidgetCat: Codable, Identifiable {
    let id: Int
    let name: String
    let distance: String
    let lastFed: String?
    let status: String?
    let image: String?
}

struct WidgetData: Codable {
    let totalNearby: Int
    let cats: [WidgetCat]
    let lastUpdated: String
}

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), data: nil)
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: configuration, data: loadData())
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
        let entries = [SimpleEntry(date: Date(), configuration: configuration, data: loadData())]
        // Reload every 15 minutes as a fallback, but app should trigger reload
        return Timeline(entries: entries, policy: .after(Date().addingTimeInterval(900)))
    }
    
    func loadData() -> WidgetData? {
        let userDefaults = UserDefaults(suiteName: "group.com.mmdev.pokecats")
        // ExtensionStorage stores JSON as a string, not Data
        if let jsonString = userDefaults?.string(forKey: "widgetData"),
           let jsonData = jsonString.data(using: .utf8) {
            let decoder = JSONDecoder()
            return try? decoder.decode(WidgetData.self, from: jsonData)
        }
        return nil
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
    let data: WidgetData?
}

struct widgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        Group {
            if let data = entry.data {
                if data.totalNearby == 0 {
                    EmptyStateView()
                } else {
                    switch family {
                    case .systemSmall:
                        SmallView(data: data)
                    case .systemMedium:
                        MediumView(data: data)
                    case .systemLarge:
                        LargeView(data: data)
                    default:
                        SmallView(data: data)
                    }
                }
            } else {
                EmptyStateView(message: "Open app to sync")
            }
        }
        .widgetURL(URL(string: "exp+pokecats://"))
    }
}

struct EmptyStateView: View {
    var message: String = "No cats nearby"
    
    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.23, green: 0.56, blue: 0.76),
                    Color(red: 0.17, green: 0.49, blue: 0.71)
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
        
            
            VStack {
                Text("🐱")
                    .font(.largeTitle)
                Text(message)
                    .font(.caption)
                    .bold()
                    .foregroundColor(.white.opacity(0.8))
            }
        }
        .containerBackground(.clear, for: .widget)
    }
}

struct SmallView: View {
    let data: WidgetData
    
    // Calculate cats that may need food (fed > 8 hours ago or never)
    var hungryCount: Int {
        data.cats.filter { cat in
            guard let lastFed = cat.lastFed else { return true }
            let formatter = ISO8601DateFormatter()
            guard let fedDate = formatter.date(from: lastFed) else { return true }
            return Date().timeIntervalSince(fedDate) > 8 * 60 * 60
        }.count
    }
    
    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                // Cat images cluster (upper area)
                ZStack {
                    // White cat (left, largest)
                    Image("LabCat")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 70, height: 70)
                        .offset(x: -20, y: 28)
                    
                    // Black cat (center, laying down)
                    Image("LabCat-2")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 50, height: 50)
                        .offset(x: 10, y: 40)
                    
                    // Orange cat (right)
                    Image("LabCat-1")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 50, height: 50)
                        .offset(x: 25, y: 55)
                }
                .frame(height: 80)
                .padding(.top, 8)
                
                Spacer()
                
                // Footer text: "X cats nearby"
                HStack(spacing: 5) {
                    Text("\(data.totalNearby)")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(Color(red: 0.75, green: 1.0, blue: 0.0)) // Lime green
                        .offset(x: 0, y: -88)
                    Text("cats nearby")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(red: 0.75, green: 1.0, blue: 0.0))
                        .offset(x: 0, y: -88)
                }
                .minimumScaleFactor(0.7)
                .lineLimit(1)
                
                // "X may need food"
                HStack(spacing: 5) {
                    Text("\(hungryCount)")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                        .offset(x: 0, y: 0)
                    Text("may need food")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                        .offset(x: 0, y: 0)
                }
                .padding(.bottom, 5)
            }
            .padding(.horizontal, 3)
        }
        .containerBackground(for: .widget) {
            RadialGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.2549, green: 0.4784, blue: 1.0), // #417AFF
                    Color(red: 0.0, green: 0.2588, blue: 0.5020)  // #004280
                ]),
                center: .center,
                startRadius: 0,
                endRadius: 220
            )
        }
    }
}

struct MediumView: View {
    let data: WidgetData
    
    // Get the closest cat
    var closestCat: WidgetCat? { data.cats.first }
    
    // Format last fed time
    var lastFedDisplay: (description: String, time: String) {
        guard let cat = closestCat, let lastFed = cat.lastFed else {
            return ("Recently", "")
        }
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: lastFed) else {
            return ("Unknown", "--:--")
        }
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm"
        let time = timeFormatter.string(from: date)
        
        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            let hour = calendar.component(.hour, from: date)
            if hour < 12 {
                return ("This morning", time)
            } else {
                return ("Today", time)
            }
        } else if calendar.isDateInYesterday(date) {
            return ("Yesterday", time)
        } else {
            return ("Days ago", time)
        }
    }
    
    // Stats
    var feedingsCount: Int { data.cats.count }
    var sightingsCount: Int { data.totalNearby }
    
    var body: some View {
        HStack(spacing: -40) {
            // LEFT: Cat info
            VStack(alignment: .leading, spacing: 4) {
                // Cat name
                Text("\(closestCat?.name ?? "Cat") is nearby")
                    .font(.system(size: 20, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
                    .padding(.leading, -10)
                // Distance
                Text(closestCat?.distance ?? "nearby")
                    .font(.system(size: 12, weight: .light, design: .rounded))
                    .foregroundColor(.white.opacity(0.9))
                    .shadow(color: .black.opacity(0.3), radius: 5)
                    .padding(.leading, -5)
                    .padding(.top, 2)
                
                Spacer()
                
                // Last Fed section with yellow bar
                HStack(alignment: .top, spacing: 8) {
                    // Yellow accent bar
                    RoundedRectangle(cornerRadius: 1)
                        .fill(Color(red: 0.95, green: 0.78, blue: 0.0)) // #F2C800
                        .frame(width: 2, height: 56)
                        .padding(.leading, -5)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Last Fed")
                            .font(.system(size: 15, weight: .semibold, design: .rounded))
                            .foregroundColor(.white)
                            .padding(.leading, -5)
                      
                        Text(lastFedDisplay.description)
                            .font(.system(size: 12, weight: .regular, design: .rounded))
                            .foregroundColor(.white.opacity(0.8))
                            .padding(.leading, -5)
                        Text(lastFedDisplay.time)
                            .font(.system(size: 12, weight: .regular, design: .rounded))
                            .foregroundColor(.white.opacity(0.8))
                            .padding(.leading, -2)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.leading, 16)
            .padding(.vertical, 12)
            
            // CENTER: Cat image
            Image("LabCat")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 90, height: 110)
                .padding(.top, 30)
                .padding(.leading, -120)

            
            // RIGHT: Stats
            VStack(alignment: .leading, spacing: 10) {
                // Feedings
                VStack(alignment: .leading, spacing: 10) {
                    Text("Feedings")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundColor(Color(red: 0.95, green: 0.78, blue: 0.0)) // #F2C800
                        .padding(.leading, 13)
                    
                    Text("\(feedingsCount)")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(Color(red: 0.85, green: 0.85, blue: 0.85)) // #D9D9D9
                        .padding(.leading, 45)
                }
                
                // Sightings
                VStack(alignment: .leading, spacing: 0) {
                    Text("Sightings")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.66)) // #FF6BA8
                        .padding(.leading, 13)

                    
                    Text("\(sightingsCount)")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(Color(red: 0.85, green: 0.85, blue: 0.85)) // #D9D9D9
                        .padding(.leading, 45)

                }
            }
            .frame(width: 90)
            .padding(.trailing, 16)
        }
        .containerBackground(for: .widget) {
            RadialGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.2549, green: 0.4784, blue: 1.0), // #417AFF
                    Color(red: 0.0, green: 0.2588, blue: 0.5020)  // #004280
                ]),
                center: .center,
                startRadius: 0,
                endRadius: 220
            )
        }
    }
}

struct LargeView: View {
    let data: WidgetData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("🐾 Cats Nearby")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Text("\(data.totalNearby)")
                    .font(.headline)
                    .foregroundColor(Color(red: 0.2, green: 0.78, blue: 0.35))
            }
            
            Divider().background(Color.white.opacity(0.2))
            
            ForEach(data.cats.prefix(4)) { cat in
                CatRow(cat: cat)
            }
            
            Spacer()
        }
        .containerBackground(Color(red: 0.1, green: 0.14, blue: 0.2), for: .widget)
    }
}

struct CatRow: View {
    let cat: WidgetCat
    
    var statusColor: Color {
        switch (cat.status ?? "").lowercased() {
        case "needs help": return .red
        case "healthy": return .green
        default: return .yellow
        }
    }
    
    var body: some View {
        HStack {
            // AsyncImage works in widgets iOS 15+
            if let imageUrl = cat.image, let url = URL(string: imageUrl) {
                 AsyncImage(url: url) { image in
                     image.resizable().aspectRatio(contentMode: .fill)
                 } placeholder: {
                     Color.gray
                 }
                 .frame(width: 30, height: 30)
                 .clipShape(Circle())
            } else {
                Circle()
                    .fill(Color.gray)
                    .frame(width: 30, height: 30)
            }
            
            VStack(alignment: .leading) {
                Text(cat.name)
                    .font(.caption)
                    .bold()
                    .foregroundColor(.white)
                Text(cat.distance)
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
        }
    }
}

struct widget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            widgetEntryView(entry: entry)
        }
        .configurationDisplayName("Cats Nearby")
        .description("See cats currently near you.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

extension ConfigurationAppIntent {
    fileprivate static var smiley: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "😀"
        return intent
    }
}

#Preview(as: .systemSmall) {
    widget()
} timeline: {
    SimpleEntry(date: .now, configuration: .smiley, data: WidgetData(totalNearby: 5, cats: [
        WidgetCat(id: 1, name: "Lollipop", distance: "50m", lastFed: nil, status: "Healthy", image: nil)
    ], lastUpdated: ""))
}
