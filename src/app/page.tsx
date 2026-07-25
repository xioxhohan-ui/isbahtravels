import Link from "next/link";
import HeroSearchTabs from "@/components/home/hero-search-tabs";
import { apiService } from "@/lib/services/api";
import { formatBDT } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, ArrowRight, ShieldCheck, Award, HeartHandshake, CheckCircle2, Plane, Hotel, Compass, FileCheck } from "lucide-react";

export default async function HomePage() {
  const featuredTours = await apiService.getTours();
  const topHotels = await apiService.getHotels();
  const topFlights = await apiService.getFlights();
  const topVisas = await apiService.getVisas();

  return (
    <div className="flex flex-col min-h-screen space-y-16 pb-16 bg-white text-slate-900">
      
      {/* HERO SECTION - CLEAN MINIMALIST WHITE & SLATE */}
      <section className="relative pt-8 pb-16 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-slate-700 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Government Civil Aviation Authorized Agency</span>
          </div>

          <h1 className="font-outfit text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Book Flights, Hotels & Tours <br className="hidden sm:inline" />
            <span className="text-emerald-700">With Complete Peace of Mind</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
            Instant flight e-tickets, ocean-view resort bookings, Umrah packages, and visa processing supported by SSLCommerz secured online payments.
          </p>

          {/* Search Tabs Component */}
          <div className="pt-2">
            <HeroSearchTabs />
          </div>

          {/* Clean Metric Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto border-t border-slate-200">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
              <p className="text-xl font-black text-slate-900">15,000+</p>
              <p className="text-[11px] text-slate-500 font-semibold">Satisfied Travelers</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
              <p className="text-xl font-black text-emerald-700">99.4%</p>
              <p className="text-[11px] text-slate-500 font-semibold">Visa Approval Success</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
              <p className="text-xl font-black text-slate-900">500+</p>
              <p className="text-[11px] text-slate-500 font-semibold">Verified Hotels</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
              <p className="text-xl font-black text-slate-900">24 / 7</p>
              <p className="text-[11px] text-slate-500 font-semibold">Customer Support</p>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURED TOUR PACKAGES (ADMIN PICKS) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">Handpicked Deals</span>
            <h2 className="font-outfit text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Featured Tour Packages
            </h2>
          </div>
          <Link href="/tours">
            <Button variant="outline" className="gap-2 rounded-xl font-bold text-xs">
              <span>View All Tour Packages</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredTours.slice(0, 3).map((tour) => (
            <Card key={tour.id} className="overflow-hidden flex flex-col border border-slate-200 bg-white hover:shadow-lg transition-shadow">
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={tour.images[0]}
                  alt={tour.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-slate-900 text-xs font-bold border border-slate-200 shadow-xs">
                  {tour.category || "Tour"}
                </div>
                <div className="absolute bottom-3 left-3 bg-slate-900/80 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3 text-emerald-400" />
                  <span>{tour.duration_days} Days / {tour.duration_days - 1} Nights</span>
                </div>
              </div>

              <CardHeader className="p-5 pb-2">
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{tour.location}</span>
                </div>
                <CardTitle className="text-base font-bold line-clamp-1 mt-1 text-slate-900">
                  {tour.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 pt-0 flex-1">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {tour.overview}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-800">{tour.rating || 4.9}</span>
                  <span className="text-slate-400">({tour.reviews_count || 140} reviews)</span>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Starts from</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatBDT(tour.price_per_person)}
                  </span>
                </div>
                <Link href={`/tours/${tour.id}`}>
                  <Button size="sm" className="font-bold text-xs rounded-xl">
                    View Package
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* POPULAR HOTELS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">Luxury Accommodation</span>
            <h2 className="font-outfit text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Popular Hotels & Resorts
            </h2>
          </div>
          <Link href="/hotels">
            <Button variant="outline" className="gap-2 rounded-xl font-bold text-xs">
              <span>View All Hotels</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topHotels.slice(0, 3).map((hotel) => (
            <Card key={hotel.id} className="overflow-hidden flex flex-col border border-slate-200 bg-white hover:shadow-lg transition-shadow">
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img src={hotel.images[0]} alt={hotel.name} className="h-full w-full object-cover" />
                <div className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 rounded-lg text-slate-900 text-xs font-bold border border-slate-200">
                  {hotel.star_rating} Star Hotel
                </div>
              </div>

              <CardHeader className="p-5 pb-2">
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{hotel.area}, {hotel.city}</span>
                </div>
                <CardTitle className="text-base font-bold line-clamp-1 mt-1 text-slate-900">
                  {hotel.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 pt-0 flex-1">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {hotel.description}
                </p>
              </CardContent>

              <CardFooter className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Nightly rate</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatBDT(hotel.min_price || 6500)}
                  </span>
                </div>
                <Link href={`/hotels/${hotel.id}`}>
                  <Button size="sm" variant="outline" className="font-bold text-xs rounded-xl">
                    View Rooms
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* WHY BOOK WITH ISBAH TRAVELS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">SSLCommerz Payment Guarantee</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pay online using bKash, Nagad, Rocket, VISA, or Mastercard with 256-bit encryption.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 shadow-xs">
              <Award className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">Best Price Transparency</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No hidden processing surcharges. Clear breakdown for flight fares and hotel rooms.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 shadow-xs">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">24/7 Dedicated Support Desk</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct phone support for urgent flight reissuance, hotel changes, and visa tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
