package com.tripbuilder.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/** Tiện ích chuẩn hóa chuỗi tiếng Việt để tìm kiếm không phân biệt dấu và hoa/thường. */
public final class VietnameseTextUtil {

    private static final Pattern COMBINING_MARKS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private VietnameseTextUtil() {
    }

    public static String normalize(String input) {
        if (input == null) {
            return "";
        }
        String replaced = input.replace('đ', 'd').replace('Đ', 'd');
        String decomposed = Normalizer.normalize(replaced, Normalizer.Form.NFD);
        return COMBINING_MARKS.matcher(decomposed)
                .replaceAll("")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
