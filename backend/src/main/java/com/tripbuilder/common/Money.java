package com.tripbuilder.common;

public final class Money {
    private Money() {}

    /** 1200000 -> "1.200.000đ" */
    public static String format(long amount) {
        return String.format("%,d", amount).replace(',', '.') + "đ";
    }
}
