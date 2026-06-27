import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Shop } from '@/models/Shop';

export async function POST(req: Request) {
  try {
    const { name, email, password, shopName } = await req.json();

    // Basic validation
    if (!name || !email || !password || !shopName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate unique slug for the shop
    let baseSlug = slugify(shopName, { lower: true, strict: true });
    if (!baseSlug) {
      baseSlug = 'shop';
    }
    let slug = baseSlug;
    let count = 1;
    while (await Shop.findOne({ slug })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    // Generate IDs to link them to each other
    const userId = new mongoose.Types.ObjectId();
    const shopId = new mongoose.Types.ObjectId();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the shop
    const shop = new Shop({
      _id: shopId,
      owner_id: userId,
      name: shopName,
      slug,
      description: `Welcome to ${shopName} virtual try-on showroom.`,
    });

    // Create the user
    const user = new User({
      _id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'owner',
      shop_id: shopId,
    });

    // Save shop and user
    await shop.save();
    try {
      await user.save();
    } catch (userError) {
      // Rollback shop if user creation fails
      await Shop.deleteOne({ _id: shopId });
      throw userError;
    }

    return NextResponse.json(
      { message: 'User and shop registered successfully', slug },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during signup. Please try again.' },
      { status: 500 }
    );
  }
}
